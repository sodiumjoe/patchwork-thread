module.exports = function(opts){
    if(!opts) opts = {};

    var mongoose = require('mongoose')
      , async = require('async')
      , models = require('./models')
      , content = opts.content || require('./content')()
      ;

    function indexMenu(conf, callback){
        var menuArr = [];
        var sortedMenu;
        console.log('menu index request received');
        buildMenu(conf.rootPath, conf, function(err, menuArray){
            if(err) return callback('error building menu: ' + err);
            sortedMenu = sortMenu(menuArray);
            saveMenu(sortedMenu, conf, function(err){
                if(err) return callback('error saving menu: ' + err);
                callback(null);
            });
        });
    };

    function buildMenu(path, conf, callback){
        content.getContentTree(path, conf, function(err, contentTree){
            mapTreeAsync(contentTree, getContentObjWithConf, function(err, mappedTree){
                stripped = stripBlogDir(mappedTree, conf);
                mappedFiles = mapFiles(stripped);
                mappedDirs = mapDirs(mappedFiles);
                callback(null, mappedDirs);
            });
        });

        function getContentObjWithConf(item, callback){
            content.getFinishedContentObj(item.path, conf, callback);
        };
    };

    function getIndexChild(array){
        var indexChild = null;
        array.forEach(function(item){
            if(item.path === 'index.md' || 'index.markdown'){
                indexChild = item;
            }
        });
        return indexChild;
    };

    function mapDirs(tree){
        tree.forEach(function(item){
            var indexChild;
            if(item.type === 'dir'){
                item.children = mapDirs(item.children);
                indexChild = getIndexChild(item.children);
                if(indexChild){
                    item.path = indexChild.path;
                    item.weight = indexChild.weight;
                    item.title = indexChild.title;
                }
            }
        });
        return tree;
    };

    function stripExt(name){
        return name.replace(".md", "").replace(".markdown","").replace("index","");
    };

    function mapFiles(tree){
        tree.forEach(function(item){
            if(item.type === 'dir'){
                item.children = mapFiles(item.children);
            }else{
                item.path = stripExt(item.path);
            }
        });
        return tree;
    };

    function mapTreeAsync(tree, fn, callback){
        async.map(tree, function(item, callback){
            if(item.type === 'dir'){
                mapTreeAsync(item.children, fn, function(err, results){
                    if(err) return callback(err);
                    item.children = results;
                    callback(null, item);
                });
            }else{
                fn(item, callback);
            }
        }, callback);
    };

    function stripBlogDir(tree, conf){
        var newTree;
        newTree = tree.filter(function(item){
            return item.path !== conf.blog.path;
        });
        return newTree;
    };

    function sortMenu(menuArray){
        menuArray.forEach(function(item){
            if(item.children){
                sortMenu(item.children);
            }
        });
        menuArray.sort(function(a, b){
            return a.weight - b.weight;
        });
        return menuArray;
    };

    function saveMenu(menuArr, conf, callback){
        conf.Menu.findOne({'title': 'menu'}, function(err, menu){
            if(err) return callback(err);
            if(menu){
                console.log('updating menu');
                menu.menuArray = menuArr;
            }else{
                console.log('saving new menu');
                menu = new conf.Menu({
                    title: "menu",
                    menuArray: menuArr
                });
            }

            menu.save(function(err){
                if(err) return callback(err);
                console.log('menu saved to mongodb');
                callback(null);
            });
        });
    };

    if(opts.menu){
        if(opts.menu.buildMenu){
            buildMenu = opts.menu.buildMenu;
        }
        if(opts.menu.sortMenu){
            sortMenu = opts.menu.sortMenu;
        }
        if(opts.menu.saveMenu){
            saveMenu = opts.menu.saveMenu;
        }
    }



    return { indexMenu: indexMenu
           , buildMenu: buildMenu
           , sortMenu: sortMenu
           , saveMenu: saveMenu
           };

};
