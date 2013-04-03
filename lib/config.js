module.exports = function(opts){

    var fs = require('fs')
      , async = require('async')
      , yaml = require('js-yaml')
      , github = require('octonode')
      , client = github.client()
      , models = require('./models')
      , configFile = opts.configFile || './config.yml'
      , configYaml = fs.readFileSync(configFile, 'utf8')
      , restify = opts.restify || require('restify')
      , mongoose = opts.mongoose || require('mongoose')
      , knox = opts.knox || require('knox')
      , confArray
      , env
      ;

    if(opts.env){
        process.env = opts.env;
    }

    confArray = yaml.load(configYaml);

    if(process.env.VCAP_SERVICES){
        try{
            env = JSON.parse(process.env.VCAP_SERVICES);
        }catch(err){
            console.log('Error parsing VCAP_SERVICES');
            console.log(err);
        }
    }else{
        env = {};
        env['mongodb-1.8'] = null;
    }

    confArray.forEach(function(conf){
        configureGitHub(conf);
        configureSearchify(conf);
        configureDatabase(conf);
        configureS3(conf);
        configureBlog(conf);
        if(!conf.rootPath){
            conf.rootPath = "/";
        }
    });

    function configureGitHub(conf){
        if(!conf.github.credentials){
            conf.github.credentials = {};
        }
        if(!conf.github.credentials.username){
            conf.github.credentials.username = conf.github.user;
        }
        if(conf.github.credentials.password_env_var){
            conf.github.credentials.password = process.env[conf.github.credentials.password_env_var];
        }else if(process.env.GITHUB_PASSWORD){
            conf.github.credentials.password = process.env.GITHUB_PASSWORD;
        }
        if(conf.github.credentials.password){
            client = github.client({
                username: conf.github.credentials.username,
                password: conf.github.credentials.password
            });
        }

        conf.github.repoName = conf.github.user + '/' + conf.github.repo;
        conf.github.ghrepo = client.repo(conf.github.repoName);
    };

    function configureSearchify(conf){
        if(!conf.searchify){
            conf.searchify = {};
        }

        if(!conf.searchify.index){
            conf.searchify.index = conf.github.user + '-' + conf.github.repo;
        }

        if(conf.searchify.private_api_env_var){
            conf.searchify.url = process.env[conf.searchify.private_api_env_var];
        }else if(process.env.SEARCHIFY_PRIVATE_API_URL){
            conf.searchify.url = process.env.SEARCHIFY_PRIVATE_API_URL;
        }else{
            conf.searchify.url = null;
        }

        if(conf.searchify.url){
            conf.searchify.client = restify.createJsonClient({
                url: conf.searchify.url
            });
            conf.searchify.client.get('/v1/indexes/' + conf.searchify.index, function(err, req, res, obj){
                if(res.statusCode !== 200){
                    conf.searchify.client = null;
                    console.log('Searchify index does not exist: ' + conf.searchify.index);
                }
            });

        }else{
            conf.searchify.client = null;
            console.log('Missing searchify credentials.');
        }
    };

    function configureDatabase(conf){
        conf.mongoConnectionURI = 'localhost';
        if(!conf.db){
            conf.db = conf.github.user + '-' + conf.github.repo;
        }

        if(env['mongodb-1.8']){
            env['mongodb-1.8'].forEach(function(item){
                if(item.name === conf.db){
                    conf.mongoConnectionURI = item.credentials.url;
                }
            });
        }
        if(conf.mongoConnectionURI === 'localhost'){
            conf.docsColl = mongoose.createConnection('localhost', conf.db);
        }else{
            conf.docsColl = mongoose.createConnection(conf.mongoConnectionURI);
        }
        conf.docsColl.on('error', console.error.bind(console, 'mongo connection error:'));
        conf.Doc = conf.docsColl.model('document', models.docSchema);
        conf.Menu = conf.docsColl.model('menu', models.menuSchema);
        if(conf.blog){
            conf.Blog = conf.docsColl.model('blog', models.blogSchema);
        }
    };

    function configureS3(conf){
        if(conf.assets){
            if(typeof(conf.assets) === "string"){
                conf.assets = { 
                    path: conf.assets
                };
            }
            if(!conf.assets.S3){
                conf.assets.S3 = {};
            }
            conf.assets.S3.key = null;
            conf.assets.S3.secret = null;

            if(conf.assets.S3.access_key_env_var && process.env[conf.assets.S3.access_key_env_var]){
                conf.assets.S3.key = process.env[conf.assets.S3.access_key_env_var];
            }else if(process.env.S3_ACCESS_KEY){
                conf.assets.S3.key = process.env.S3_ACCESS_KEY;
            }

            if(conf.assets.S3.secret_env_var && process.env[conf.assets.S3.secret_env_var]){
                conf.assets.S3.secret = process.env[conf.assets.S3.secret_env_var];
            }else if(process.env.S3_SECRET){
                conf.assets.S3.secret = process.env.S3_SECRET;
            }

            if(!conf.assets.S3.bucket){
                conf.assets.S3.bucket = conf.github.user + '-' + conf.github.repo;
            }

            if(conf.assets.S3.key && conf.assets.S3.secret){
                conf.assets.S3.client = knox.createClient({
                    key: conf.assets.S3.key,
                    secret: conf.assets.S3.secret,
                    bucket: conf.assets.S3.bucket
                });
            }else{
                conf.assets.S3 = null;
                console.log('Missing S3 credentials');
            }

        }
    };

    function configureBlog(conf){
        if(typeof(conf.blog) === "string"){
            conf.blog = { 
                path: conf.blog
            };
        }
    };

    function getConf(user, repoName){
        var confMatch = null;
        confArray.forEach(function(conf){
            if(conf.github.user === user && conf.github.repo === repoName){
                confMatch = conf;
            }
        });

        return confMatch;
    };

    return {
        getConf: getConf,
        configureGitHub: configureGitHub,
        configureSearchify: configureSearchify,
        configureDatabase: configureDatabase,
        configureS3: configureS3,
        configureBlog: configureBlog
    }
};
