var mongoose = require('mongoose')
  , async = require('async')
  , content = require('./content')()
  , models = require('./models')
  ;

module.exports = function(contentParam, fakeFuncs){

    if(contentParam){
        content = contentParam;
    }

    function indexMenu(conf, callback){
        var menuArr = [];
        console.log('menu index request received');
        buildMenu(conf.rootPath, conf, function(err, menuArray){
            if(err){
                callback('error building menu: ' + err);
            }else{
                sortMenu(menuArray, function(err, sortedMenu){
                    if(err){
                        callback('error sorting menu: ' + err);
                    }else{
                        saveMenu(sortedMenu, conf, function(err){
                            if(err){
                                callback('error saving menu: ' + err);
                            }else{
                                callback(null);
                            }
                        });
                    }
                });
            }
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
            if(item.type === 'dir'){
                item.children = mapDirs(item.children);
                var indexChild = getIndexChild(item.children);
                if(indexChild){
                    item.path = indexChild.path;
                    item.weight = indexChild.weight;
                    item.title = indexChild.title;
                }
            }
        });
        return tree;
    };

    /*
    function mapDirs(tree, callback){
        async.map(tree, function(item, callback){
            if(item.type === 'dir'){
                mapDirs(item.children, function(err, result){
                    item.children = result;
                    var indexChild = getIndexChild(result);
                    if(indexChild){
                        item.path = indexChild.path;
                        item.weight = indexChild.weight;
                        item.title = indexChild.title;
                    }
                    callback(null, item);
                });
            }else{
                callback(null, item);
            }
        }, callback);
    };
    */

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

    /*
    function mapFiles(tree, callback){
        mapTreeAsync(tree, function(item, callback){
            if(item.type === 'dir'){
                mapFiles(item.children, callback);
            }else{
                item.path = stripExt(item.path);
                callback(null, item);
            }
        }, callback);
    };
    */

    function mapTreeAsync(tree, fn, callback){
        async.map(tree, function(item, callback){
            if(item.type === 'dir'){
                mapTreeAsync(item.children, fn, function(err, results){
                    if(err){
                        callback(err);
                    }else{
                        item.children = results;
                        callback(null, item);
                    }
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

    function sortMenu(menuArr, callback){
        async.sortBy(menuArr, function(item, sortCallback){
            if(item.children){
                if(item.children.length > 0){
                    sortMenu(item.children, function(err, results){
                        item.children = results;
                        sortCallback(null, item.weight);
                    });
                }else{
                    sortCallback(null, item.weight);
                }
            }else{
                sortCallback(null, item.weight);
            }
        }, callback);
    };

    function saveMenu(menuArr, conf, callback){
        conf.Menu.findOne({'title': 'menu'}, function(err, menu){
            if(err){
                callback(err);
            }else if(menu){
                console.log('updating menu');
                menu.menuArray = menuArr;
            }else{
                console.log('saving new menu');
                var menu = new conf.Menu({
                    title: "menu",
                    menuArray: menuArr
                });
            }

            menu.save(function(err){
                if(err){
                    callback(err);
                }else{
                    console.log('menu saved to mongodb');
                    callback(null);
                }
            });
        });
    };

    if(fakeFuncs){
        if(fakeFuncs.buildMenu){
            buildMenu = fakeFuncs.buildMenu;
        }
        if(fakeFuncs.sortMenu){
            sortMenu = fakeFuncs.sortMenu;
        }
        if(fakeFuncs.saveMenu){
            saveMenu = fakeFuncs.saveMenu;
        }
    }



    return { indexMenu: indexMenu
           , buildMenu: buildMenu
           , sortMenu: sortMenu
           , saveMenu: saveMenu
           };

};
