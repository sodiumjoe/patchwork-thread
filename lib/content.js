var async = require('async'),
    request = require('request'),
    yamlFront = require('./yamlFront');

function parseDir(path, conf, fileFunc, callback){
    conf.github.ghrepo.contents(path, function(err, data){
        async.forEach(data, 
            function(item, forCallback){
                if(item.path.substring(0, 1)!== '.'){ //ignore dotfiles
                    if(item.type === 'file'){
                        if(item.path.substring(item.path.length - 9) === '.markdown' || item.path.substring(item.path.length - 3) === '.md'){ //only markdown files
                            fileFunc(item.path, forCallback);
                        }else{
                            console.log('skipped non-markdown file: ' + item.path);
                            forCallback(null);
                        }
                    }else if(item.type === 'dir'){
                        parseDir(item.path, conf, fileFunc, forCallback);
                    }else{
                        console.log('unkown file type: ' + item.path);
                        forCallback(null);
                    }
                }else{
                    console.log('skipped dotfile: ' + item.path);
                    forCallback(null);
                }
            },
            function(err){
                if(err){
                    callback(err);
                }else{
                    callback(null);
                }
            });
    });
}

function getContent(path, conf, callback){
    conf.ghrepo.contents(path, function(err, data){
        if(err){
            callback(err);
        }else{
            if(data.type === 'file'){
                var rawHeader = {Accept: 'application/vnd.github.beta.raw+json'},
                    rawPath = 'https://api.github.com/repos/' + conf.github.repoName + '/contents/' + path,
                    options = {
                        uri: rawPath,
                        headers: rawHeader
                    };
                request(options, function(err2, rawContent, body){
                    if(err2){
                        callback(err2);
                    }else{
                        callback(null, rawContent.body);
                    }
                });    
            }else{
                callback('Not a file: ' + path);
            }
        }
    });
}

function parseContent(rawContent, callback){
    yamlFront.parse(rawContent, function(err, parsedObj){
        if(err){
            callback(err);
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

exports.parseDir = parseDir;
exports.parseContent = parseContent;
exports.getContent = getContent;
