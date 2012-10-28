var async = require('async');

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

exports.getAssetList = getAssetList;
