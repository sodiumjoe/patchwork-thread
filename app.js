var async = require('async'),
    express = require('express'),
    app = express.createServer(),
    content = require('./lib/content'),
    menu = require('./lib/menu'),
    database = require('./lib/database'),
    search = require('./lib/search'),
    models = require('./lib/models'),
    config = require('./lib/config');

app.use(express.logger());
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.logger());
});

app.post('/pusher', function(req, res){
    console.log('post received');
    try{
        p = req.body.payload;
        console.log(p);

        var obj = JSON.parse(p),
            lastCommit = obj.commits[obj.commits.length - 1],
            updates = lastCommit.added.concat(lastCommit.modified),
            removed = lastCommit.removed;

        config.getConf(obj.repository.owner.name, obj.repository.name, function(err, conf){
            if(err){
                console.log(err);
            }else{

                console.log("Last commit: \n" + lastCommit.id);
                console.log("Updating: \n " + updates.toString());

                async.forEach(updates, function(item, callback){
                    content.getContent(item, conf, function(err, rawContent){
                        if(err){
                            callback(err);
                        }else{
                            content.parseContent(rawContent, function(err, parsedObj){
                                if(err){
                                    callback(err);
                                }else{
                                    database.addToDB(parsedObj, conf, function(err){
                                        if(err){
                                            callback(err);
                                        }else{
                                            search.indexToSearch(parsedObj, conf, function(err){
                                                if(err){
                                                    callback(err);
                                                }else{
                                                    callback(null);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }, 
                function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Updates complete");
                    }
                });

                console.log("Removing: \n " + removed.toString());
                async.forEach(removed, function(path, callback){
                    search.deindexFromSearch(path, conf, function(err){
                        if(err){
                            callback(err);
                        }else{
                            database.removeFromDB(path, conf, callback);
                        }
                    });
                }, 
                function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log('Removals complete');
                    }
                });
                menu.indexMenu(conf, function(err){
                    if(err){
                        console.log(err);
                    }
                });
            }
        });
    }catch(err){
        console.log("Error:", err);
    }
    res.send('Done with post');    
});

app.get('/index/:user/:repo', function(req, res){

    config.getConf(req.params.user, req.params.repo, function(err, conf){
        if(err){
            console.log(err);
            res.send(err);
        }else{
            console.log(conf);
        }
    });
/*
    if(!req.params.conf || parseInt(req.params.conf) >= conf.length){
        res.send('missing or invalid conf param ' + typeof(req.params.conf));
    }else{
        var currentConf = conf[req.params.conf];
        console.log('index request received');
        res.send('index request received for ' + currentConf.github.repoName);
        content.parsePath(currentConf.rootPath, client.repo(currentConf.github.repoName), currentConf, function(err){
            if(err){
                console.log(err);
            } else {
                console.log('content index complete');
            }
        });

        menu.indexMenu(currentConf, function(err){
            if(err){
                console.log(err);
            }else{
                console.log('menu index complete');
            }
        });
    }*/
});

app.listen(process.env.VCAP_APP_PORT || 3000);
