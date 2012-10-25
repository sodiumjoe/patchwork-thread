var async = require('async'),
    express = require('express'),
    app = express.createServer(),
    content = require('./lib/content')(),
    menu = require('./lib/menu'),
    database = require('./lib/database'),
    search = require('./lib/search'),
    models = require('./lib/models'),
    config = require('./lib/config'),
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
    payload.push(req, function(err){
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
            content.parseDir(conf.rootPath, conf, function(filePath, forCallback){
                content.getFinishedContentObj(filePath, conf, function(err, finishedObj){
                    if(err){
                        forCallback('error getFinishedObj(): ' + err);
                    }else{
                        database.addToDB(finishedObj, conf, function(err){
                            if(err){
                                forCallback('error addToDB: ' + err);
                            }else{
                                search.indexToSearch(finishedObj, conf, function(err){
                                    if(err){
                                        forCallback('error indexToSearch: ' + err);
                                    }else{
                                        console.log(filePath + ' saved');
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
                    console.log(err);
                    res.send(err);
                }else{
                    console.log('done');
                    menu.indexMenu(conf, function(err){
                        if(err){
                            console.log(err);
                        }else{
                            res.send('done');
                        }
                    });
                }
            });
        }
    });
});

app.listen(process.env.VCAP_APP_PORT || 3000);
