var async = require('async')
// lib to test
  , menu = require('../lib/menu')()
// test data
  , menuArr = []
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
                  , { weight: 6 }
                  , { weight: 5 }
                  ];
        callback(null);
    }
  , 'blog and assets dirs': function(test){
        menu.sortMenu(menuArr, function(err, menuArr){
            test.equal(menuArr[0].weight, 5);
            test.equal(menuArr[1].weight, 6);
            test.equal(menuArr[2].weight, 7);
            test.equal(menuArr[3].weight, 8);
            test.equal(menuArr[4].weight, 9);
            test.done();
        });
    }
};
exports['test menu.saveMenu'] = {
    'blog and assets dirs': function(test){
        /*
        menu.saveMenu(menuArr, conf, function(err){
        });
        */
        test.done();
    }
};
