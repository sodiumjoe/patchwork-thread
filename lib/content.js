var async = require('async'),
    request = require('request'),
    yaml = require('yamlparser');

module.exports = function(requestParam){
    if(typeof requestParam !== 'undefined'){
        request = requestParam;
    }
    function parseDir(path, conf, fileFunc, callback){
        conf.github.ghrepo.contents(path, function(err, data){
            if(err){
                callback(err);
            }else{
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
                                if(conf.ignoreDirs){
                                    async.forEach(conf.ignoreDirs, function(dir, forCallback2){
                                        var ignoreDir = false;
                                        if(item.path === dir){
                                            console.log("Ignoring directory: " + item.path);
                                            ignoreDir = true;
                                            forCallback2(null);
                                        }else{
                                            parseDir(item.path, conf, fileFunc, forCallback);
                                            forCallback2(null);
                                        }
                                    },
                                    function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }else{
                                    parseDir(item.path, conf, fileFunc, forCallback);
                                }
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
            }
        });
    }
        
    function getContent(path, conf, callback){
        conf.github.ghrepo.contents(path, function(err, data){
            if(err){
                callback(err);
            }else{
                if(data.type === 'file'){
                    var rawHeader = {Accept: 'application/vnd.github.beta.raw+json'};
                    if(conf.github.credentials){
                        var rawPath = 'https://' + conf.github.credentials.username + ':' + conf.github.credentials.password + '@api.github.com/repos/' + conf.github.repoName + '/contents/' + path;
                    }else{
                        var rawPath = 'https://api.github.com/repos/' + conf.github.repoName + '/contents/' + path;
                    }
                    var options = {
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
        //regex to find yaml front matter
        var regex = /^\s*---[\s\S]+?---\s*/gi;
        var match = regex.exec(rawContent);
        if(match){
            var yamlString = match[0];
            var parsedObj = yaml.eval(yamlString);
            parsedObj.content = rawContent.replace(match[0], '');
            callback(null, parsedObj);
        }else{
            callback("Error parsing yaml front matter because of no match in file: ")
        }
    }

    function addExtraMetadata(parsedObj, path, callback){
        if(typeof(path)==='string'){
            var pathArr = path.split('/'),
                cat = '';
            pathArr.pop();
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
        }else{
            callback('path not a string');
        }
    }

    return {
        parseDir: parseDir,
        getContent: getContent,
        parseContent: parseContent,
        addExtraMetadata: addExtraMetadata
    };
}
