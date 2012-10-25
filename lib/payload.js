var async = require('async'),
    content = require('./content')(),
    database = require('./database'),
    search = require('./search'),
    config = require('./config');

function parse(req, callback){
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
}

function push(req, callback){
    parse(req, function(err, deltaObj){
        if(err){
            callback(err);
        }else{
            config.getConf(deltaObj.user, deltaObj.repository, function(err, conf){
                async.forEach(deltaObj.updated, 
                    function(path, forCallback){
                        content.getFinishedContentObj(path, conf, function(err, finishedObj){
                            if(err){
                                callback(err);
                            }else{
                                database.addToDB(finishedObj, conf, function(err){
                                    if(err){
                                        callback(err);
                                    }else{
                                        search.indexToSearch(finishedObj, conf, function(err){
                                            if(err){
                                                forCallback('error indexToSearch: ' + err);
                                            }else{
                                                console.log(path + ' saved');
                                                forCallback(null);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    },
                    function(err){
                        if(err){
                            callback(err);
                        }else{
                            async.forEach(deltaObj.removed, 
                                function(path, forCallback){
                                    database.removeFromDB(path, conf, function(err){
                                        if(err){
                                            callback(err);
                                        }else{
                                            search.deindexFromSearch(path, conf, forCallback);
                                        }
                                    });
                                },
                                function(err){
                                    if(err){
                                        callback(err);
                                    }else{
                                        console.log('Updated commit ' + deltaObj.commit.id + ' ' + deltaObj.commit.timestamp);
                                        callback(null);
                                    }
                                });
                        }
                    });
            });
        }
    });
}

exports.push = push;
exports.parse = parse;
