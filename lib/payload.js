module.exports = function(opts){
    if(!opts) opts = {};

    var async = require('async')
      , menu = require('./menu')()
      , content = opts.content || require('./content')()
      , database = opts.database || require('./database')
      , search = opts.search || require('./search')
      , asset = opts.asset || require('./asset')()
      , config = opts.config || require('./config')()
      ;

    function parsePayload(req, callback){
        var errorThrown = false
          , payloadObj = {}
          , lastCommit, updated, removed, deltaObj, conf
          ;

        try{
            payloadObj = JSON.parse(req.body.payload);
        }catch(err){
            return callback(err);
        }

        lastCommit = payloadObj.commits[payloadObj.commits.length - 1];
        updated = lastCommit.added.concat(lastCommit.modified);
        removed = lastCommit.removed;
        deltaObj = {
            repository: payloadObj.repository.name,
            user: payloadObj.repository.owner.name,
            updated: [],
            updatedAssets: [],
            removed: [],
            removedAssets: [],
            commit: {
                id: lastCommit.id,
                timestamp: lastCommit.timestamp
            }
        };

        conf = config.getConf(deltaObj.user, deltaObj.repository);
        if(conf){
            async.series([
                function(callback){
                    filterPaths(updated, conf, function(err, filteredPaths){
                        deltaObj.updated = filteredPaths;
                        callback(err);
                    });
                },
                function(callback){
                    async.reject(updated, function(item, callback){
                        callback(conf.assets.path + '/' !== item.substring(0, conf.assets.path.length + 1));
                    },
                    function(results){
                        deltaObj.updatedAssets = results;
                        callback(null);
                    });
                },
                function(callback){
                    filterPaths(removed, conf, function(err, filteredPaths){
                        deltaObj.removed = filteredPaths;
                        callback(err);
                    });
                },
                function(callback){
                    async.reject(removed, function(item, callback){
                        callback(conf.assets.path + '/' !== item.substring(0, conf.assets.path.length + 1));
                    },
                    function(results){
                        deltaObj.removedAssets = results;
                        callback(null);
                    });
                }
            ],
            function(err){
                callback(err, conf, deltaObj);
            });
        }else{
            callback("Error: no conf for payload");
        }
    };

    function filterPaths(pathArray, conf, callback){
        var noAssets, filteredFiles, filteredPaths;
        noAssets = pathArray.filter(isNotAssetDir);
        async.map(noAssets, function(path, callback){
            conf.github.ghrepo.contents(path, callback);
        },
        function(err, fileObjArr){
            if(err) return callback(err);
            filteredFiles = content.filterFiles(fileObjArr);
            filteredPaths = filteredFiles.map(function(fileObj){
                return fileObj.path;
            });
            callback(null, filteredPaths);
        });

        function isNotAssetDir(item){
            return conf.assets.path + '/' !== item.substring(0, conf.assets.path.length + 1);
        };
    };


    function handleUpdates(deltaObj, conf, callback){

        async.forEachSeries(deltaObj.updated, updateObj, callback);

        function updateObj(path, callback){
            content.getFinishedContentObj(path, conf, function(err, finishedObj){
                if(err) return callback(err);
                async.parallel([addToDB, addToSearch], callback);
                function addToDB(callback){
                    database.addToDB(finishedObj, conf, function(err){
                        if(err) console.log("Error adding to db: " + finishedObj.path);
                        callback(null);
                    });
                };
                function addToSearch(callback){
                    search.indexToSearch(finishedObj, conf, function(err){
                        if(err)console.log("Error adding to search: " + finishedObj.path);
                        callback(null);
                    });
                };
            });
        };
    };

    function handleUpdatedAssets(deltaObj, conf, callback){
        async.forEachSeries(deltaObj.updatedAssets, updateAsset, callback);
        function updateAsset(path, callback){
            asset.updateAsset(path, conf, function(err){
                if(err) console.log(err);
                callback(null);
            });
        };
    };

    function handleRemovals(deltaObj, conf, callback){
        async.forEachSeries(deltaObj.removed, removeObj, callback);
        function removeObj(path, callback){
            async.parallel([removeFromDB, deindex], callback);
            function removeFromDB(callback){
                database.removeFromDB(path, conf, function(err){
                    if(err) console.log("error removing from db: " + path);
                    callback(null);
                });
            };
            function deindex(callback){
                search.deindexFromSearch(path, conf, function(err){
                    if(err) console.log("error removing from search: " + path);
                    callback(null);
                });
            };
        };
    };

    function handleRemovedAssets(deltaObj, conf, callback){
        callback(null);
    };

    function pushPayload(req, callback){
        parsePayload(req, function(err, conf, deltaObj){
            async.parallel([
                function(callback){
                    handleUpdates(deltaObj, conf, callback);
                },
                function(callback){
                    handleUpdatedAssets(deltaObj, conf, callback);
                },
                function(callback){
                    handleRemovals(deltaObj, conf, callback);
                },
                function(callback){
                    handleRemovedAssets(deltaObj, conf, callback);
                },
                function(callback){
                    menu.indexMenu(conf, callback);
                }],
                function(err, results){
                    console.log('Updated commit ' + deltaObj.commit.id + ' ' + deltaObj.commit.timestamp);
                    callback(err);
                });
        });
    };

    return {
        parsePayload: parsePayload,
        pushPayload: pushPayload,
        handleUpdates: handleUpdates,
        handleUpdatedAssets: handleUpdatedAssets,
        handleRemovals: handleRemovals
    };
};
