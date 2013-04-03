module.exports = function(opts){

    var async = require('async')
      , request = opts.request || require('request')
      , yaml = require('js-yaml')
      , pagedown = require('pagedown')
      , converter = new pagedown.Converter()
      , _s = require('underscore.string')
      , imgRegex = /\<img[\s\S]+?\/>/
      ;

    function getFileList(conf, callback){
        var fileList;
        getContentTree(conf.rootPath, conf, function(err, tree){
            if(err) return onError(err);
            fileList = flattenTree(tree);
            callback(null, fileList);
        });
    };

    function getContentTree(path, conf, callback){
        var resultArray = [];
        conf.github.ghrepo.contents(path, function(err, data){
            if(err) return callback(err);
            var validFiles
              , validDirs = []
              ;

            validFiles = filterFiles(data);
            resultArray = resultArray.concat(validFiles);
            validDirs = filterDirs(data, conf);
            if(validDirs.length > 0){
                async.map(validDirs, function(dir, callback){
                    getContentTree(dir.path, conf, function(err, result){
                        if(err) return callback(err);
                        callback(null, { path: dir.path, type: 'dir', children: result });
                    });
                }, function(err, results){
                    resultArray = resultArray.concat(results);
                    callback(null, resultArray);
                });
            }else{
                callback(null, resultArray);
            }
        });
    };

    function flattenTree(tree){
        var flatTree = [];
        tree.forEach(function(item){
            if( isDir(item) ){
                flatTree = flatTree.concat(flattenTree(item.children));
            }else{
                flatTree.push(item);
            }
        });
        return flatTree;
    };

    function filterFiles(fileArray){
        return fileArray.filter(isFile).filter(isNotDotfile).filter(isMarkdownFile).filter(isNotReadme);
    };

    function isFile(item){
        return(item.type==='file');
    };
    function isNotDotfile(item){
        var pathArr = item.path.split('/');
        return (pathArr[pathArr.length - 1].substring(0, 1) !== '.');
    };
    function isMarkdownFile(item){
        return (item.path.toLowerCase().substring(item.path.length - 9) === '.markdown' || item.path.toLowerCase().substring(item.path.length - 3) === '.md');
    };
    function isNotReadme(item){
        return !(item.path.toLowerCase().substring(0,6) === 'readme');
    };

    function filterDirs(dirArray, conf, filterOpts, callback){
        dirArray = dirArray.filter(isDir)
        .filter(function(dir){
            return isNotIgnored(dir.path, conf);
        })
        .filter(function(dir){
            return isNotAssetDir(dir.path, conf);
        });
        return dirArray;
    };

    function isDir(item){
        return (item.type==='dir');
    };
    function isNotIgnored(path, conf){
        var ignored;
        if(conf.ignore){
            ignored = conf.ignore.some(function(dir){
                return path === dir;
            });
            return !ignored;
        }else{
            return true;
        }
    };
    function isNotAssetDir(path, conf){
        return !(conf.assets && (path === conf.assets.path));
    };
        
    function getContent(path, conf, callback){
        conf.github.ghrepo.contents(path, function(err, data){
            if(err) return callback(err);
            var rawHeader, rawPath, options;
            if(data.type === 'file'){
                rawHeader = {Accept: 'application/vnd.github.beta.raw+json'};
                if(conf.github.credentials){
                    rawPath = 'https://' + conf.github.credentials.username + ':' + conf.github.credentials.password + '@api.github.com/repos/' + conf.github.repoName + '/contents/' + path;
                }else{
                    rawPath = 'https://api.github.com/repos/' + conf.github.repoName + '/contents/' + path;
                }
                options = {
                    uri: rawPath,
                    headers: rawHeader
                };
                request(options, function(err, rawContent, body){
                    if(err) return callback(err);
                    callback(null, rawContent);
                });    
            }else{
                callback('Not a file: ' + path);
            }
        });
    };

    function parseContent(rawContent){
        //regex to find yaml front matter
        var regex = /^\s*---[\s\S]+?---\s*/gi
          , idRegex = /(<h\d)(>)(.+?){#([\S\w]+?)}(<\/h\d>)/g
          , match = regex.exec(rawContent.body)
          , yamlString
          , parsedObj
          ;
        if(match){
            yamlString = match[0].replace(/---/g,'');
            parsedObj = yaml.load(yamlString);
            parsedObj.body = converter.makeHtml(rawContent.body.replace(match[0], '')).replace(idRegex, "$1 id=" + '"' + "$4" + '"' + "$2$3$5");
            return parsedObj;
        }else{
            return "Error parsing yaml front matter because of no match in file: "
        }
    };

    function addExtraMetadata(parsedObj, path, callback){
        var pathArr = path.split('/')
          , cat = ''
          ;
        pathArr.pop();
        pathArr.forEach(function(item){
            cat += (item + '.');
        });
        parsedObj.docid = path.replace(".markdown","").replace('.md','').replace(/\//g,'-');
        parsedObj.path = path.replace(".markdown","").replace('.md','').replace("/index","");
        parsedObj.category = cat.substring(0, cat.length-1);
        if(!parsedObj.weight){
            parsedObj.weight = 0;
        }
        if(parsedObj.date){
            var dateArr = parsedObj.date.split('/');
            if(dateArr.length < 3){
                dateArr = parsedObj.date.split('-');
            }
            parsedObj.month = dateArr[0];
            parsedObj.year = dateArr[2];
            parsedObj.slug = parsedObj.path.split('/').slice(-1);
            parsedObj.excerpt = _s.prune(_s.stripTags(parsedObj.body), 130, '&#8230;');
            if(imgRegex.test(parsedObj.body)){
                parsedObj.img = imgRegex.exec(parsedObj.body)[0];
            }
        }
        return parsedObj;
    };

    function getFinishedContentObj(path, conf, callback){
        getContent(path, conf, function(err, rawContent){
            var parsedObj;
            if(err) return callback('getContent error for path ' + path + ': ' + err);
            parsedObj = parseContent(rawContent);
            if(typeof(parsedObj) === 'string'){
                callback('parseContent error for path ' + path + ': ' + parsedObj);
            }else{
                callback(null, addExtraMetadata(parsedObj, path));
            }
        });
    };

    return { getContent: getContent
           , parseContent: parseContent
           , addExtraMetadata: addExtraMetadata
           , getFinishedContentObj: getFinishedContentObj
           , filterFiles: filterFiles
           , filterDirs: filterDirs
           , getContentTree: getContentTree
           , flattenTree: flattenTree
           , getFileList: getFileList
           , isMarkdownFile: isMarkdownFile
           };
};
