var async = require('async'),
    https = require('https'),
    fs = require('fs');

module.exports = function(fsParam, httpsParam){
    if(fsParam){
        fs = fsParam;
    }

    if(httpsParam){
        https = httpsParam;
    }

    function handleAssets(conf, callback){
        getAssetList(conf.assets.path, conf, function(err, assetArr){
            if(err){
                console.log(err);
            }else{
                async.forEachSeries(assetArr, function(item, forCallback){
                    asset.updateAsset(item.path, conf, forCallback);
                }, function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log('Assets updated to S3');
                    }
                    callback(null);
                });
            }
        });
    };

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
        };
        checkDirExists(path, function(err){
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
                            }
                            callback(null);
                        });
                    });
                });
            }
        });
    };

    function checkDirExists(path, callback){
        var pathArr = path.split('/'),
            pathStr = './';

        pathArr.pop();
        async.forEachSeries(pathArr, function(item, forCallback){
            pathStr += item;
            fs.stat(pathStr, function(err, stats){
                // errno 2 -- ENOENT, No such file or directory 
                if(err){
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
                        console.log(err);
                        pathStr += '/';
                        forCallback(null); 
                    }
                }else{
                    pathStr += '/';
                    forCallback(null);
                }
            });
        }, callback);

    };

    function uploadToS3(filePath, conf, callback){
        conf.assets.S3.client.putFile('./' + filePath, filePath, {'x-amz-acl': 'public-read'}, function(err, res){
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
                        callback(null);
                    }
                });
            }
        });
    };

    function removeAsset(path, conf, callback){
        conf.assets.S3.client.deleteFile(path, function(err, res){
            if(err){
                callback(err);
            }else{
                console.log("Deleting " + path + " from S3: " + res.statusCode);
                callback(null);
            }
        });
    };

    return {
        getAssetList: getAssetList,
        downloadFile: downloadFile,
        uploadToS3: uploadToS3,
        updateAsset: updateAsset,
        removeAsset: removeAsset,
        handleAssets: handleAssets
    }
};
