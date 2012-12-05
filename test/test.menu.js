var async = require('async')
// lib to test
  , menu = require('../lib/menu')()
// test data
  , menuArr = []
  , conf = {}
  ;

exports['test menu.indexMenu'] = {
    'blog and assets dirs': function(test){
        /*
        menu.indexMenu(conf, function(err){
        });
        */
        test.done();
    }
};

exports['test menu.buildMenu'] = {
    'blog and assets dirs': function(test){
        /*
        menu.buildMenu(path, conf, menuArray, function(err, menuArray){
        });
        */
        test.done();
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
        menu.sortMenu(menuArr, function(err, menuArr){
            test.equal(menuArr[0].weight, 5);
            test.equal(menuArr[1].weight, 6);
            test.equal(menuArr[2].weight, 7);
            test.equal(menuArr[3].weight, 8);
            test.equal(menuArr[4].weight, 9);
            test.equal(menuArr[5].weight, 10);
            test.equal(menuArr[5].children[0].weight, 4);
            test.equal(menuArr[5].children[1].weight, 5);
            test.equal(menuArr[5].children[2].weight, 6);
            test.done();
        });
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
        menu.saveMenu(menuArr, conf, function(err){
            test.equal(saved[0], 'b');
            test.equal(saved[1], 2);
            test.equal(saved[2], 'g');
            test.done();
        });
    }
};
