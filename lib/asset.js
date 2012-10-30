var async = require('async'),
    knox = require('knox');

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

function uploadToS3(fileObj, conf, callback){
    if(conf.assets.S3){
        conf.assets.S3.client.putFile(fileObj.body, '/cron-1.jpg', function(err, res){
            if(err){
                console.log(err);
                callback(null);
            }else{
                callback(null);
            }
        });
    }else{
        console.log("No S3 credentials");
        callback(null);
    }
};

exports.getAssetList = getAssetList;
exports.uploadToS3 = uploadToS3;
