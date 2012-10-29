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
    test.expect(5);
    asset.getAssetList('whatever', conf, function(err, assetArray){
        if(err){
            console.log(err);
        }else{
            test.equals(assetArray.length, 4);
            test.equals(assetArray[0].path, 'asset1.png');
            test.equals(assetArray[1].path, 'asset2.png');
            test.equals(assetArray[2].path, 'asset3.png');
            test.equals(assetArray[3].path, 'assetDir/asset4.png');
            test.done();
        }
    });
};
