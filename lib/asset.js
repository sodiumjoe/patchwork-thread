var async = require('async'),
    https = require('https'),
    fs = require('fs');

function getAssetList(path, conf, callback){
    var assetArray = [];
    conf.github.ghrepo.contents(path, function(err, data){
        parseAssetArray(data, function(err){
            if(err){
                callback(err);
            }else{
                callback(null, assetArray);
            }
        });
    });

    function parseAssetArray(inputArray, callback){
        async.forEach(inputArray, function(item, forCallback){
            if(item.type === 'file'){
                assetArray.push(item);
                forCallback(null);
            }else if(item.type === 'dir'){
                conf.github.ghrepo.contents(item.path, function(err, data){
                    parseAssetArray(data, forCallback);
                });
            }else{
                console.log('unknown data type: ' + item.path);
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
    };
};

function downloadFile(path, conf, callback){
    var options = {
        host: 'raw.github.com',
        port: 443,
        path: '/' + conf.github.repoName + '/master/' + path
    },
        pathArr = path.split('/'),
        pathStr = './';

    pathArr.pop();

    async.forEachSeries(pathArr, function(item, forCallback){
        pathStr += item;
        fs.stat(pathStr, function(err, stats){
            // errno 2 -- ENOENT, No such file or directory 
            if(err){
                console.log(err);
                if(err.errno == 2 || 34){
                    fs.mkdir(pathStr, function(err){
                        if(err){
                            forCallback(err);
                        }else{
                            pathStr += '/';
                            forCallback(null);
                        }
                    });
                }else{
                    pathStr += '/';
                    forCallback(null); 
                }
            }else{
                pathStr += '/';
                forCallback(null);
            }
        });
    }, function(err){
        if(err){
            callback(err);
        }else{
            var request = https.get(options, function(res){
                var imagedata = '';
                res.setEncoding('binary');
                res.on('data', function(chunk){
                    imagedata += chunk;
                });

                res.on('end', function(){
                    fs.writeFile('./' + path, imagedata, 'binary', function(err){
                        if(err){
                            console.log(err);
                        }else{
                            callback(null);
                        }
                    });
                });
            });
        }
    });
};

function uploadToS3(filePath, conf, callback){
    conf.assets.S3.client.putFile('./' + filePath, filePath, function(err, res){
        if(err){
            callback(err);
        }else{
            callback(null);
        }
    });
};

function updateAsset(path, conf, callback){
    downloadFile(path, conf, function(err){
        if(err){
            callback(err);
        }else{
            uploadToS3(path, conf, function(err){
                if(err){
                    callback(err);
                }else{
                    console.log(path + ' updated in S3');
                    callback(null);
                }
            });
        }
    });
};

exports.getAssetList = getAssetList;
exports.downloadFile = downloadFile;
exports.uploadToS3 = uploadToS3;
exports.updateAsset = updateAsset;
