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
                conf.github.ghrepo.contents(item.path, function(err, data2){
                    parseAssetArray(data2, forCallback);
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
    console.log(path);
    var options = {
        host: 'raw.github.com',
        port: 443,
        path: '/' + 'joebadmo/pfdocs-test' + '/master/' + path
    };

    var request = https.get(options, function(res){
        var imagedata = '';
        res.setEncoding('binary');
        res.on('data', function(chunk){
            imagedata += chunk;
        });

        res.on('end', function(){
            fs.writeFile('./assets/' + path, imagedata, 'binary', function(err){
                if (err){
                    callback(err);
                }else{
                    callback(null);
                }
            });
        });
    });
};

function uploadToS3(fileObj, conf, callback){
    callback(null);
};

//request.get

exports.getAssetList = getAssetList;
exports.downloadFile = downloadFile;
exports.uploadToS3 = uploadToS3;
