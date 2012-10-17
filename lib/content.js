var async = require('async'),
    yamlFront = require('./lib/yamlFront'),
    mongoose = require('mongoose'),
    restify = require('restify'),
    search = require('./lib/search');

function parsePath(path, ghrepo, currentConf, callback){
    var searchifyClient = restify.createJsonClient({
            url: currentConf.searchify.url
        });
    var docsColl = mongoose.createConnection(currentConf.mongoConnectionURI, currentConf.db);
    docsColl.on('error', console.error.bind(console, 'connection error:'));
    var Doc = docsColl.model('document', docSchema);
    ghrepo.contents(path, function(err, data){
        if(err){
            callback(err);
        }else{
            async.forEach(data, 
                function(item, forCallback){
                    if(item.path.substring(0, 1)!== '.'){
                        if(item.type === 'file' && (item.path.substring(item.path.length - 9) === '.markdown' || item.path.substring(item.path.length - 3) === '.md')){
                            if(item.path.substring(0, 1) === '/'){
                                item.path = item.path.substring(1);
                            }
                            getContent(item.path, ghrepo, currentConf.github.repoName, function(err, parsedObj){
                                if(err){
                                    forCallback(err);
                                }else{
                                    if(currentConf.searchify.url !== null){
                                        search.indexToSearch(parsedObj, currentConf.searchify.index, searchifyClient, function(err){
                                            addToDB(parsedObj, Doc, forCallback);
                                        });
                                    }else{
                                        addToDB(parsedObj, Doc, forCallback);
                                    }

                                }
                            });
                        }else if(item.type === 'dir'){
                            if(item.path === currentConf.imagePath){
                                console.log('skipped images dir: ' + item.path);
                                forCallback(null);
                            }else{
                                parsePath(item.path, ghrepo, currentConf, forCallback);
                            }
                        }else{
                            console.log('skipped non-markdown file: ' + item.path);
                            forCallback(null);
                        }
                    }else{
                        console.log('skipped dotfile: ' + item.path);
                        forCallback(null);
                    }
                }, 
                function(err){
                    if(err){
                        if(callback){
                            callback(err);
                        }else{
                            console.log(err);
                        }
                    }else{
                        callback(null);
                    }
            });
        }
    });
}

function getContent(path, ghrepo, repoName, callback){
    ghrepo.contents(path, function(err, data){
        if(err){
            callback(err);
        }else{
            if(data.type === 'file'){
                var rawHeader = {Accept: 'application/vnd.github.beta.raw+json'},
                    rawPath = 'https://api.github.com/repos/' + repoName + '/contents/' + path,
                    options = {
                        uri: rawPath,
                        headers: rawHeader
                    };
                request(options, function(err2, rawContent, body){
                    if(err2){
                        callback(err2);
                    }else{
                        parseContent(path, rawContent.body, callback);
                    }
                });    
            }else{
                callback('Not a file: ' + path);
            }
        }
    });
}

function parseContent(path, rawContent, callback){
    yamlFront.parse(rawContent, function(err, parsedObj){
        if(err){
            callback(err + path);
        }else{
            var pathArr = path.split('/');
            pathArr.pop();
            var cat = '';
            async.forEachSeries(pathArr, function(item, forCallback){
                cat += (item + '.');
                forCallback(null);
            },function(err){
                if(err){
                    callback(err);
                }else{
                    parsedObj.docid = path.replace(".markdown","").replace('.md','').replace(/\//g,'-');
                    parsedObj.path = path.replace(".markdown","").replace('.md','').replace("index","");
                    parsedObj.category = cat.substring(0, cat.length-1);
                    if(!parsedObj.weight){
                        parsedObj.weight = 0;
                    }
                    callback(null, parsedObj);
                }
            });
        }
    });
}

exports.parsePath = parsePath;
exports.parseContent = parseContent;
exports.getContent = getContent;
