// Libarary to test
var asset = require('../lib/asset');

// test data
var dir = [
    {
        path: 'asset1.png',
        type: 'file',
    },
    {
        path: 'asset2.png',
        type: 'file',
    },
    {
        path: 'asset3.png',
        type: 'file',
    },
    {
        path: 'assetDir',
        type: 'dir'
    }
],
    dir2 = [
    {
        path: 'assetDir/asset4.png',
        type: 'file'
    }
],
    conf = {
        github: {
            ghrepo: {
                contents: function(path, callback){
                    if(path === 'assetDir'){
                        callback(null, dir2);
                    }else{
                        callback(null, dir);
                    }
                }
            }
        }
    };

exports['test asset.getAssetList'] = function (test) {
    asset.getAssetList('whatever', conf, function(err, assetArray){
        if(err){
            console.log(err);
        }else{
            test.equals(assetArray.length, 4);
            test.done();
        }
    });
};

/*exports['test asset.compareLists'] = function (test) {
};*/
