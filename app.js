var fs = require('fs'),
    Converter = require('./lib/pagedown/Markdown.Converter').Converter,
    converter = new Converter(),
    restify = require('restify'),
    async = require('async'),
    express = require('express'),
    app = express.createServer(),
    mongoose = require('mongoose'),
    github = require('octonode'),
    client = github.client(),
    content = require('./lib/content'),
    menu = require('./lib/menu'),
    database = require('./lib/database'),
    search = require('./lib/search'),
    models = require('./lib/models'),
    confData = fs.readFileSync('./config.json'),
    env = {};

try{
    var conf = JSON.parse(confData).config;
}catch(err){
    console.log('Error in config.json file:');
    console.log(err);
}

if(process.env.VCAP_SERVICES){
    env = JSON.parse(process.env.VCAP_SERVICES);
    mongoConnectionURI = 'mongodb://' + env['mongodb-1.8'][0]['credentials']['username'] + ':' + env['mongodb-1.8'][0]['credentials']['password'] + '@' + env['mongodb-1.8'][0]['credentials']['host'] + ':' + env['mongodb-1.8'][0]['credentials']['port'] + '/' + env['mongodb-1.8'][0]['credentials']['database'];
}

async.forEach(conf, function(item, callback){
    item.github.repoName = item.github.user + '/' + item.github.repo;
    if(item.searchify.url === null){
        item.searchify.url = process.env[item.searchify.privateEnvVar] || null;
    }
    item.mongoConnectionURI = 'localhost';
    if(env['mongodb-1.8']){
        async.forEach(env['mongodb-1.8'], function(item2, callback2){
            if(item2.name === item.db){
                item.mongoConnectionURI = 'mongodb://' + item2.credentials.username + ':' + item2.credentials.password + '@' + item2.credentials.host + ':' + item2.credentials.port + '/' + item2.credentials.database;
            }
            callback2(null);
        },
        function(err){
            if(err){
                callback(err);
            }else{
                callback(null);
            }
        });
    }
},
function(err){
    if(err){
        console.log(err);
    }
});

app.use(express.logger());
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.logger());
});

app.post('/pusher', function(req, res){
    console.log('post received');
    var currentConf = {};
    try{
        p = req.body.payload;
        console.log(p);

        var obj = JSON.parse(p);

        async.forEach(conf, function(item, callback){
            if(item.github.user === obj.repository.owner.name && item.github.repo === obj.repository.name){
                currentConf = item;
            }
            callback(null);
        },
        function(err){
            if(err){
                console.log(err);
            }else if(currentConf === {}){
                console.log('No configuration for pushed repository: ' + obj.repository.owner.name + '/' + obj.repository.name);
            }else{
                var searchifyClient = restify.createJsonClient({
                        url: currentConf.searchify.url
                    }),
                    docsColl = mongoose.createConnection(currentConf.mongoConnectionURI, currentConf.db);
                docsColl.on('error', console.error.bind(console, 'connection error:'));
                var Doc = docsColl.model('document', models.docSchema),
                    lastCommit = obj.commits[obj.commits.length - 1],
                    updates = lastCommit.added.concat(lastCommit.modified),
                    removed = lastCommit.removed;
                console.log("Last commit: \n" + lastCommit.id);
                console.log("Updating: \n " + updates.toString());
                async.forEach(updates, function(item, callback){
                    content.getContent(item, client.repo(currentConf.github.repoName), currentConf.github.repoName, function(err, parsedObj){
                        if(err){
                            callback(err);
                        }else{
                            if(currentConf.searchify.url !== null){
                                indexToSearch(parsedObj, currentConf.searchify.index, searchifyClient, function(err){
                                    addToDB(parsedObj, Doc, callback);
                                });
                            }else{
                                database.addToDB(parsedObj, Doc, callback);
                            }
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
                async.forEach(removed, function(item, callback){
                    if(currentConf.searchify.url !== null){
                        search.deindexFromSearch(item, currentConf.searchify.index, searchifyClient, function(err){
                            if(err){
                                callback(err);
                            }else{
                                database.removeFromDB(item, Doc, callback);
                            }
                        });
                    }else{
                        database.removeFromDB(item, Doc, callback);
                    }
                }, 
                function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log('Removals complete');
                    }
                });
                menu.indexMenu(currentConf, function(err){
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

app.get('/index/:conf', function(req, res){
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
    }
});

app.listen(process.env.VCAP_APP_PORT || 3000);
