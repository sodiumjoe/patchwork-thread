var async = require('async'),
    content = require('./content')(),
    menu = require('./menu'),
    database = require('./database'),
    search = require('./search'),
    asset = require('./asset')(),
    config = require('./config')();


module.exports = function(contentParam, assetParam, databaseParam, searchParam){

    //dep injection
    if(contentParam){
        content = contentParam;
    }
    if(assetParam){
        asset = assetParam;
    }
    if(databaseParam){
        database = databaseParam;
    }
    if(searchParam){
        search = searchParam;
    }

    function parsePayload(req, callback){
        var errorThrown = false;
        try{
            var payloadObj = JSON.parse(req.body.payload),
                lastCommit = payloadObj.commits[payloadObj.commits.length - 1],
                updated = lastCommit.added.concat(lastCommit.modified),
                removed = lastCommit.removed,
                deltaObj = {
                    repository: payloadObj.repository.name,
                    user: payloadObj.repository.owner.name,
                    updated: updated,
                    removed: removed,
                    commit: {
                        id: lastCommit.id,
                        timestamp: lastCommit.timestamp
                    }
                };

        }catch(err){
            callback(err);
            errorThrown = true;
        }

        if(!errorThrown){
            callback(null, deltaObj);
        }
    };

    function handleUpdates(deltaObj, conf, callback){
        async.forEachSeries(deltaObj.updated, 
            function(path, forCallback){
                content.getFinishedContentObj(path, conf, function(err, finishedObj){
                    if(err){
                        forCallback(err);
                    }else if(conf.assets.path + '/' === path.substring(0, conf.assets.path.length + 1)){
                        asset.updateAsset(path, conf, function(err){
                            if(err){
                                console.log(err);
                            }
                            forCallback(null);
                        });
                    }else{
                        async.parallel([
                            function(callback){
                                database.addToDB(finishedObj, conf, function(err){
                                    if(err){
                                        console.log(err);
                                    }
                                    callback(null);
                                });
                            },
                            function(callback){
                                search.indexToSearch(finishedObj, conf, function(err){
                                    if(err){
                                        console.log(err);
                                    }
                                    callback(null);
                                });
                            }
                        ],
                        function(err, results){
                            if(err){
                                console.log(err);
                            }
                            forCallback(null);
                        });
                    }
                });
            },
            callback
        );
    };

    function handleRemovals(deltaObj, conf, callback){
        async.forEach(deltaObj.removed, 
            function(path, forCallback){
                if(conf.assets.path + '/'  === path.substring(0, conf.assets.path.length + 1)){
                    asset.removeAsset(path, conf, function(err){
                        if(err){
                            console.log(err);
                        }
                        forCallback(null);
                    });
                }else{
                    async.parallel([
                        function(callback){
                            database.removeFromDB(path, conf, function(err){
                                if(err){
                                    console.log(err);
                                }
                                callback(null);
                            });
                        },
                        function(callback){
                            search.deindexFromSearch(path, conf, function(err){
                                if(err){
                                    console.log(err);
                                }
                                callback(null);
                            });
                        }],
                        function(err, results){
                            forCallback(err);
                        }
                    );
                }
            },
            callback
        );
    };

    function pushPayload(req, callback){
        parsePayload(req, function(err, deltaObj){
            if(err){
                callback(err);
            }else{
                config.getConf(deltaObj.user, deltaObj.repository, function(err, conf){
                    async.parallel([
                        function(callback){
                            handleUpdates(deltaObj, conf, callback);
                        },
                        function(callback){
                            handleRemovals(deltaObj, conf, callback);
                        },
                        function(callback){
                            menu.indexMenu(conf, function(err){
                                if(err){
                                    callback(err);
                                }else{
                                    console.log('Updated commit ' + deltaObj.commit.id + ' ' + deltaObj.commit.timestamp);
                                    callback(null);
                                }
                            });
                        }],
                        function(err, results){
                            callback(err);
                        });
                });
            }
        });
    };

    return {
        parsePayload: parsePayload,
        pushPayload: pushPayload,
        handleUpdates: handleUpdates,
        handleRemovals: handleRemovals
    };
};
