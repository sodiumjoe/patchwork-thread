var fs = require('fs'),
    async = require('async'),
    restify = require('restify'),
    mongoose = require('mongoose'),
    knox = require('knox'),
    github = require('octonode'),
    client = github.client(),
    models = require('./models'),
    confData = fs.readFileSync('./config.json');

try{
    var confArray = JSON.parse(confData).config;
}catch(err){
    console.log('Error in config.json file:');
    console.log(err);
}

if(process.env.VCAP_SERVICES){
    try{
        var env = JSON.parse(process.env.VCAP_SERVICES);
    }catch(err){
        console.log('Error parsing VCAP_SERVICES');
        console.log(err);
    }
}else{
    var env = {};
    env['mongodb-1.8'] = null;
}

async.forEach(confArray, function(conf, callback){
    async.parallel([
        function(callback){
            configureGitHub(conf, callback);
        },
        function(callback){
            configureSearchify(conf, callback);
        },
        function(callback){
            configureDatabase(conf, callback);
        },
        function(callback){
            configureS3(conf, callback);
        }],
        function(err, results){
            callback(err);
    });
},
function(err){
    if(err){
        console.log(err);
    }
});

function configureGitHub(conf, callback){
    if(conf.github.credentials){
        conf.github.credentials.password = process.env[conf.github.credentials.password_env_var];
        client = github.client({
            username: conf.github.credentials.username,
            password: conf.github.credentials.password
        });
    }else{
        client = github.client();
    }
    conf.github.repoName = conf.github.user + '/' + conf.github.repo;
    conf.github.ghrepo = client.repo(conf.github.repoName);
};

function configureSearchify(conf, callback){
    if(conf.searchify.url === null){
        conf.searchify.url = process.env[conf.searchify.private_api_env_var] || null;
    }

    if(conf.searchify.url){
        conf.searchify.client = restify.createJsonClient({
            url: conf.searchify.url
        });
    }else{
        conf.searchify.client = null;
        console.log('Missing searchify credentials.');
    }
};

function configureDatabase(conf, callback){
    conf.mongoConnectionURI = 'localhost';
    if(env['mongodb-1.8']){
        async.forEach(env['mongodb-1.8'], function(item, callback2){
            if(item.name === conf.db){
                conf.mongoConnectionURI = item.credentials.url;
            }
            callback2(null);
        },
        callback
        );
    }
    if(conf.mongoConnectionURI === 'localhost'){
        conf.docsColl = mongoose.createConnection('localhost', conf.db);
    }else{
        conf.docsColl = mongoose.createConnection(conf.mongoConnectionURI);
    }
    conf.docsColl.on('error', console.error.bind(console, 'mongo connection error:'));
    conf.Doc = conf.docsColl.model('document', models.docSchema);
    conf.Menu = conf.docsColl.model('menu', models.menuSchema);
};

function configureS3(conf, callback){
    if(conf.assets.S3.access_key_env_var && conf.assets.S3.secret_env_var && conf.assets.S3.bucket){
        if(process.env[conf.assets.S3.access_key_env_var] && process.env[conf.assets.S3.secret_env_var]){
            conf.assets.S3.client = knox.createClient({
                key: process.env[conf.assets.S3.access_key_env_var],
                secret: process.env[conf.assets.S3.secret_env_var],
                bucket: conf.assets.S3.bucket
            });
        }else{
            conf.assets.S3 = null;
            console.log('Missing S3 environment variables');
        }
    }else{
        conf.assets.S3 = null;
        console.log('Missing S3 credentials');
    }
};

function getConf(user, repoName, callback){
    var currentConf = null;
    async.forEach(confArray, function(conf, forCallback){
        if(conf.github.user === user && conf.github.repo === repoName){
            currentConf = conf;
        }
        forCallback(null);
    },
    function(err){
        if(err){
            callback(err);
        }else{
            if(currentConf === null){
                callback("Error: github username and repo name do not match any conf in config.json");
            }else{
                callback(null, currentConf);
            }
        }
    });
};

exports.getConf = getConf;
