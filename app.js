var async = require('async'),
    express = require('express'),
    app = express.createServer(),
    content = require('./lib/content')(),
    menu = require('./lib/menu'),
    database = require('./lib/database'),
    search = require('./lib/search'),
    models = require('./lib/models'),
    config = require('./lib/config'),
    asset = require('./lib/asset'),
    payload = require('./lib/payload');

app.use(express.logger());
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.logger());
});

app.post('/pusher', function(req, res){
    console.log('post received');
    payload.pushPayload(req, function(err){
        if(err){
            console.log(err);
        }else{
            console.log('Post finished ' + Date());
        }
    });
});

app.get('/index/:user/:repo', function(req, res){
    config.getConf(req.params.user, req.params.repo, function(err, conf){
        if(err){
            console.log(err);
            res.send(err);
        }else{
            async.parallel([
                function(callback){
                    content.parseDir(conf.rootPath, conf, function(filePath, forCallback){
                        content.getFinishedContentObj(filePath, conf, function(err, finishedObj){
                            if(err){
                                forCallback('error getFinishedObj(): ' + err);
                            }else{
                                if(finishedObj.isAsset){
                                    asset.updateAsset(finishedObj.path, conf, forCallback);
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
                                                    forCallback('error indexToSearch: ' + err);
                                                }else{
                                                    console.log(filePath + ' saved');
                                                    forCallback(null);
                                                }
                                            });
                                        }],
                                        function(err, results){
                                            forCallback(err);
                                    });
                                }
                            }
                        });
                }, callback);
            },
            function(callback){
                menu.indexMenu(conf, function(err){
                    if(err){
                        console.log(err);
                    }
                    callback(null);
                });
            },
            function(callback){
                asset.getAssetList('assets', conf, function(err, assetArr){
                    if(err){
                        console.log(err);
                    }else{
                        async.forEach(assetArr, function(item, forCallback){
                            asset.updateAsset(item.path, conf, forCallback);
                        }, function(err){
                            if(err){
                                console.log(err);
                            }else{
                                console.log('Assets updated to S3');
                            }
                            callback(null);
                        });
                    }
                });
            }],
            function(err, results){
                console.log('done');
                res.send('done');
            });
        }
    });
});

app.listen(process.env.VCAP_APP_PORT || 3000);
