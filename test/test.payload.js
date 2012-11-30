// deps to inject
var fakeContent = {
        getFinishedContentObj: function(path, conf, callback){
            var finishedObj = {
                path: path
            };
            callback(null, finishedObj);
        }
    },
    fakeAsset = {
        assets: [],
        removed: [],
        updateAsset: function(path, conf, callback){
            fakeAsset.assets.push(path);
            callback(null);
        },
        removeAsset: function(path, conf, callback){
            fakeAsset.removed.push(path);
            callback(null);
        }
    },
    fakeDatabase = {
        contents: [],
        removed: [],
        addToDB: function(finishedObj, conf, callback){
            fakeDatabase.contents.push(finishedObj.path);
            callback(null);
        },
        removeFromDB: function(path, conf, callback){
            fakeDatabase.removed.push(path);
            callback(null)
        }
    },
    fakeSearch = {
        contents: [],
        removed: [],
        indexToSearch: function(finishedObj, conf, callback){
            fakeSearch.contents.push(finishedObj.path);
            callback(null);
        },
        deindexFromSearch: function(path, conf, callback){
            fakeSearch.removed.push(path);
            callback(null)
        }
    };

// Libarary to test
var payload = require('../lib/payload')(fakeContent, fakeAsset, fakeDatabase, fakeSearch);

// test data
var req = {
    body: {
        payload: '{"before": "5aef35982fb2d34e9d9d4502f6ede1072793222d","repository": {"url": "http://github.com/defunkt/github","name": "github","description": "You\'re lookin\' at it.", "watchers": 5, "forks": 2, "private": 1, "owner": {"email": "chris@ozmm.org","name": "defunkt"}},"commits": [{"id": "41a212ee83ca127e3c8cf465891ab7216a705f59","url": "http://github.com/defunkt/github/commit/41a212ee83ca127e3c8cf465891ab7216a705f59","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "okay i give in","timestamp": "2008-02-15T14:57:17-08:00"},{"id": "de8251ff97ee194a289832576287d6f8ad74e3d0","url": "http://github.com/defunkt/github/commit/de8251ff97ee194a289832576287d6f8ad74e3d0","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "update pricing a tad","timestamp": "2008-02-15T14:36:34-08:00","added": ["filepath.rb"],"removed": ["services/overview.markdown"],"modified": ["test.markdown" ]}], "after": "de8251ff97ee194a289832576287d6f8ad74e3d0","ref": "refs/heads/master"}'
    }
};

exports['test payload.parse'] = function (test) {
    payload.parsePayload(req, function(err, deltaObj){
        test.expect(5);
        if(err){
            console.log(err);
            test.done();
        }else{
            test.equals(deltaObj.repository, 'github');
            test.equals(deltaObj.user, 'defunkt');
            test.equals(deltaObj.updated[0], 'filepath.rb');
            test.equals(deltaObj.updated[1], 'test.markdown');
            test.equals(deltaObj.removed[0], 'services/overview.markdown');
            test.done();
        }
    });
};

exports['test handleUpdates'] = function(test){
    // test data
    var deltaObj = {
            updated: [
                'assets/asset.png',
                'assets/asset2.png',
                'assets/asset3.png',
                'assets/other/asset4.png',
                'test.markdown',
                'test2.markdown',
                'random/test3.markdown',
                'random/other/test4.markdown'
            ]
        },
        conf = {
            assets: {
                path: 'assets'
            }
        };

    payload.handleUpdates(deltaObj, conf, function(err){
        test.equal(fakeAsset.assets[0], 'assets/asset.png');
        test.equal(fakeAsset.assets[1], 'assets/asset2.png');
        test.equal(fakeAsset.assets[2], 'assets/asset3.png');
        test.equal(fakeAsset.assets[3], 'assets/other/asset4.png');
        test.equal(fakeAsset.assets.length, 4);
        test.equal(fakeDatabase.contents[0], 'test.markdown');
        test.equal(fakeDatabase.contents[1], 'test2.markdown');
        test.equal(fakeDatabase.contents[2], 'random/test3.markdown');
        test.equal(fakeDatabase.contents[3], 'random/other/test4.markdown');
        test.equal(fakeDatabase.contents.length, 4);
        test.equal(fakeSearch.contents[0], 'test.markdown');
        test.equal(fakeSearch.contents[1], 'test2.markdown');
        test.equal(fakeSearch.contents[2], 'random/test3.markdown');
        test.equal(fakeSearch.contents[3], 'random/other/test4.markdown');
        test.equal(fakeSearch.contents.length, 4);
        test.done();
    });
};

exports['test handleRemovals'] = function(test){
    // test data
    var deltaObj = {
            removed: [
                'removed.md',
                'removed2.md',
                'dir/removed3.md',
                'dir/other/removed4.md',
                'assets/removed5.png',
                'assets/other/removed6.jpg'
            ]
        },
        conf = {
            assets: {
                path: 'assets'
            }
        };

    payload.handleRemovals(deltaObj, conf, function(err){
        test.equal(fakeAsset.removed[0], 'assets/removed5.png');
        test.equal(fakeAsset.removed[1], 'assets/other/removed6.jpg');
        test.equal(fakeAsset.removed.length, 2);
        test.equal(fakeDatabase.removed[0], 'removed.md');
        test.equal(fakeDatabase.removed[1], 'removed2.md');
        test.equal(fakeDatabase.removed[2], 'dir/removed3.md');
        test.equal(fakeDatabase.removed[3], 'dir/other/removed4.md');
        test.equal(fakeDatabase.removed.length, 4);
        test.equal(fakeSearch.removed[0], 'removed.md');
        test.equal(fakeSearch.removed[1], 'removed2.md');
        test.equal(fakeSearch.removed[2], 'dir/removed3.md');
        test.equal(fakeSearch.removed[3], 'dir/other/removed4.md');
        test.equal(fakeSearch.removed.length, 4);
        test.done();
    });
};

exports['test pushPayload'] = function(test){
    test.done();
};
