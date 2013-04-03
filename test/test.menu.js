var async = require('async')
// lib to test
  , menu = require('../lib/menu')()
// test data
  , menuArr = []
  , conf = {}
  ;

exports['test menu.indexMenu'] = {
    setUp: function(callback){
        menuArr = [];
        conf.rootPath = 'root';
        conf.dummy = 'dummy';
        var buildMenu = function(path, conf, callback){
            menuArr.push('built');
            menuArr.push(path);
            menuArr.push(conf.dummy);
            callback(null, menuArr);
        };
        var sortMenu = function(menuArr, callback){
            menuArr.push('sorted');
            return menuArr;
        };
        var saveMenu = function(menuArr, conf, callback){
            menuArr.push(conf.dummy);
            menuArr.push('saved');
            callback(null);
        };
        menu = require('../lib/menu')( { menu: { buildMenu: buildMenu, sortMenu: sortMenu, saveMenu: saveMenu } });
        callback(null);
    }

  , 'tearDown': function(callback){
        menu = require('../lib/menu')();
        callback(null);
        menuArr = [];
    }
  , 'blog and assets dirs': function(test){
        test.expect(6);
        menu.indexMenu(conf, function(err){
            test.equal(menuArr[0], 'built');
            test.equal(menuArr[1], 'root');
            test.equal(menuArr[2], 'dummy');
            test.equal(menuArr[3], 'sorted');
            test.equal(menuArr[4], 'dummy');
            test.equal(menuArr[5], 'saved');
            test.done();
        });
    }
};

exports['test menu.buildMenu'] = {
    setUp: function(callback){
        var data = [ { path: 'index.md', type: 'file' }
                   , { path: 'something.md', type: 'file' }
                   , { path: 'something-else.md', type: 'file' }
                   , { path: 'fakeDir', type: 'dir' }
                   , { path: 'blog', type: 'dir' }
                   ]
          , data2 = [ { path: 'fakeDir/other.md', type: 'file' }
                    , { path: 'fakeDir/other2.md', type: 'file' }
                    , { path: 'fakeDir/index.md', type: 'file' }
                    ]
          , blogData = [ { path: 'should/not.md', type: 'file' }
                       ]
          , fakeContent = {
                getFinishedContentObj: function(path, conf, callback){
                    if(path==='fakeDir'){
                        callback(null, { path: path + '/index.markdown', title: path, weight: path });
                    }else{
                        callback(null, { path: path, title: path, weight: path });
                    }
                }
            }
          ;

        fakeContent.getContentTree = require('../lib/content')().getContentTree;
        fakeContent.isDir = require('../lib/content')().isDir;
        fakeContent.isMarkdownFile = require('../lib/content')().isMarkdownFile;
        menu = require('../lib/menu')({content: fakeContent});
        conf = { 
            github: {
                ghrepo: {
                    contents: function(path, callback){
                        if(path==='fakeDir'){
                            callback(null, data2);
                        }else if(path==='blog'){
                            callback(null, blogData);
                        }else{
                            callback(null, data);
                        }
                    }
                }
            }
            , blog: { path: 'blog' }
            , assets: { path: 'assets' }
        };
        menuArr = [];
        callback(null);
    }
  , 'blog and assets dirs': function(test){
        test.expect(20);
        menu.buildMenu('root', conf, function(err, menuArray){
            test.equal(menuArray[0].path,   '');
            test.equal(menuArray[0].weight, 'index.md');
            test.equal(menuArray[0].title,  'index.md');
            test.equal(menuArray[1].path,   'something');
            test.equal(menuArray[1].weight, 'something.md');
            test.equal(menuArray[1].title,  'something.md');
            test.equal(menuArray[2].path,   'something-else');
            test.equal(menuArray[2].weight, 'something-else.md');
            test.equal(menuArray[2].title,  'something-else.md');
            test.equal(menuArray[3].path,   'fakeDir/');
            test.equal(menuArray[3].weight, 'fakeDir/index.md');
            test.equal(menuArray[3].title,  'fakeDir/index.md');
            test.equal(menuArray[3].children[0].path,   'fakeDir/other');
            test.equal(menuArray[3].children[0].weight, 'fakeDir/other.md');
            test.equal(menuArray[3].children[0].title,  'fakeDir/other.md');
            test.equal(menuArray[3].children[1].path,   'fakeDir/other2');
            test.equal(menuArray[3].children[1].weight, 'fakeDir/other2.md');
            test.equal(menuArray[3].children[1].title,  'fakeDir/other2.md');
            test.equal(menuArray.length, 4);
            test.equal(menuArray[3].children.length, 3);
            test.done();
        });
    }
};

exports['test menu.sortMenu'] = {
    setUp: function(callback){
        menuArr = [ { weight: 9 }
                  , { weight: 8 }
                  , { weight: 7 }
                  , { weight: 10
                    , children: [ { weight: 6 }
                                , { weight: 5 }
                                , { weight: 4 }
                                ]
                    }
                  , { weight: 6 }
                  , { weight: 5 }
                  ];
        callback(null);
    }
  , 'with recursion': function(test){
        var sortedMenu = [];
        test.expect(9);
        sortedMenu = menu.sortMenu(menuArr);
        test.equal(sortedMenu[0].weight, 5);
        test.equal(sortedMenu[1].weight, 6);
        test.equal(sortedMenu[2].weight, 7);
        test.equal(sortedMenu[3].weight, 8);
        test.equal(sortedMenu[4].weight, 9);
        test.equal(sortedMenu[5].weight, 10);
        test.equal(sortedMenu[5].children[0].weight, 4);
        test.equal(sortedMenu[5].children[1].weight, 5);
        test.equal(sortedMenu[5].children[2].weight, 6);
        test.done();
    }
};

exports['test menu.saveMenu'] = {
    'no errors, menu object exists in db': function(test){
        var menuObj = {
            save: function(callback){
                saved = menuObj.menuArray;
                callback(null);
            }
          , menuArray: []
          , saved: []
        };
        conf = { 
            Menu: {
                findOne: function(obj, callback){
                    callback(null, menuObj); 
                }
            }
        };
        menuArr = ['a', 1, 'f'];
        test.expect(3);
        menu.saveMenu(menuArr, conf, function(err){
            test.equal(saved[0], 'a');
            test.equal(saved[1], 1);
            test.equal(saved[2], 'f');
            test.done();
        });
    }
  , 'no errors, no menu object in db': function(test){
        var menuObj = {
            save: function(callback){
                saved = menuObj.menuArray;
                callback(null);
            }
          , menuArray: []
          , saved: []
        };
        conf = { 
            Menu: function(obj){
                this.save = function(callback){
                    saved = obj.menuArray;
                    callback(null);
                };
                return {
                    save: this.save
                };
            }
        };
        conf.Menu.findOne = function(obj, callback){
            callback(null, null);
        };
        menuArr = ['b', 2, 'g'];
        test.expect(3);
        menu.saveMenu(menuArr, conf, function(err){
            test.equal(saved[0], 'b');
            test.equal(saved[1], 2);
            test.equal(saved[2], 'g');
            test.done();
        });
    }
};
