// deps to inject
var content = { getFinishedContentObj: function(path, conf, callback){
                  var finishedObj = { path: path };
                  callback(null, finishedObj);
                }
              , filterFiles: require('../lib/content')().filterFiles
              }
  , asset = { contents: []
            , removed: []
            , updateAsset: function(path, conf, callback){
                  asset.contents.push(path);
                  callback(null);
              }
            , removeAsset: function(path, conf, callback){
                  asset.removed.push(path);
                  callback(null);
              }
            }
  , database = { contents: []
               , removed: []
               , addToDB: function(finishedObj, conf, callback){
                     database.contents.push(finishedObj.path);
                     callback(null);
                 }
               , removeFromDB: function(path, conf, callback){
                     database.removed.push(path);
                     callback(null)
                 }
               }
  , search = { contents: []
             , removed: []
             , indexToSearch: function(finishedObj, conf, callback){
                   search.contents.push(finishedObj.path);
                   callback(null);
               }
             , deindexFromSearch: function(path, conf, callback){
                   search.removed.push(path);
                   callback(null)
               }
             }
  , conf = { assets: { path: 'assets' }
           , github: { ghrepo: {
                           contents: function(path, callback){ callback(null, {path: path, type: 'file'}); }
                       }
                     }
           }
  , config = { getConf: function(user, repo){ return conf; } }
  ;

// Libarary to test
var payload = require('../lib/payload')({content: content, asset: asset, database: database, search: search, config: config});

// test data
var req = {
    body: {
        payload: '{"before": "5aef35982fb2d34e9d9d4502f6ede1072793222d","repository": {"url": "http://github.com/defunkt/github","name": "github","description": "You\'re lookin\' at it.", "watchers": 5, "forks": 2, "private": 1, "owner": {"email": "chris@ozmm.org","name": "defunkt"}},"commits": [{"id": "41a212ee83ca127e3c8cf465891ab7216a705f59","url": "http://github.com/defunkt/github/commit/41a212ee83ca127e3c8cf465891ab7216a705f59","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "okay i give in","timestamp": "2008-02-15T14:57:17-08:00"},{"id": "de8251ff97ee194a289832576287d6f8ad74e3d0","url": "http://github.com/defunkt/github/commit/de8251ff97ee194a289832576287d6f8ad74e3d0","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "update pricing a tad","timestamp": "2008-02-15T14:36:34-08:00","added": ["filepath.rb", "assets/asset.png"],"removed": ["services/overview.markdown", "assets/removedAsset.png"],"modified": ["test.markdown", "assets/asset2.png"]}], "after": "de8251ff97ee194a289832576287d6f8ad74e3d0","ref": "refs/heads/master"}'
    }
};

exports['test payload.parse'] = function (test) {
    payload.parsePayload(req, function(err, conf, deltaObj){
        test.expect(8);
        test.equals(deltaObj.repository, 'github');
        test.equals(deltaObj.user, 'defunkt');
        test.equals(deltaObj.updated[0], 'test.markdown');
        test.equals(deltaObj.updated.length, 1);
        test.equals(deltaObj.removed[0], 'services/overview.markdown');
        test.equals(deltaObj.updatedAssets[0], 'assets/asset.png');
        test.equals(deltaObj.updatedAssets[1], 'assets/asset2.png');
        test.equals(deltaObj.removedAssets[0], 'assets/removedAsset.png');
        test.done();
    });
};

exports['test handleUpdates'] = function(test){
    // test data
    var deltaObj = {
            updated: [
                'test.markdown',
                'test2.markdown',
                'random/test3.markdown',
                'random/other/test4.markdown'
            ]
    };

    payload.handleUpdates(deltaObj, 'dummy', function(err){
        test.equal(database.contents[0], 'test.markdown');
        test.equal(database.contents[1], 'test2.markdown');
        test.equal(database.contents[2], 'random/test3.markdown');
        test.equal(database.contents[3], 'random/other/test4.markdown');
        test.equal(database.contents.length, 4);
        test.equal(search.contents[0], 'test.markdown');
        test.equal(search.contents[1], 'test2.markdown');
        test.equal(search.contents[2], 'random/test3.markdown');
        test.equal(search.contents[3], 'random/other/test4.markdown');
        test.equal(search.contents.length, 4);
        test.done();
    });
};

exports['test handleUpdatedAssets'] = function(test){
    // test data
    var deltaObj = {
            updatedAssets: [
                'assets/test.png',
                'assets/test2.png',
                'assets/random/test3.png',
                'assets/random/other/test4.png'
            ]
    },
        conf = {
            assets: {
                path: 'assets'
            }
        };

    payload.handleUpdatedAssets(deltaObj, conf, function(err){
        test.equal(asset.contents[0], 'assets/test.png');
        test.equal(asset.contents[1], 'assets/test2.png');
        test.equal(asset.contents[2], 'assets/random/test3.png');
        test.equal(asset.contents[3], 'assets/random/other/test4.png');
        test.equal(asset.contents.length, 4);
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
                'dir/other/removed4.md'
            ]
        };
    payload.handleRemovals(deltaObj, {assets: { path:'assets'} }, function(err){
        test.equal(database.removed[0], 'removed.md');
        test.equal(database.removed[1], 'removed2.md');
        test.equal(database.removed[2], 'dir/removed3.md');
        test.equal(database.removed[3], 'dir/other/removed4.md');
        test.equal(database.removed.length, 4);
        test.equal(search.removed[0], 'removed.md');
        test.equal(search.removed[1], 'removed2.md');
        test.equal(search.removed[2], 'dir/removed3.md');
        test.equal(search.removed[3], 'dir/other/removed4.md');
        test.equal(search.removed.length, 4);
        test.done();
    });
};

exports['test pushPayload'] = function(test){
    test.done();
};
