var env = {
        GITHUB_PASSWORD: 'Something',
        SEARCHIFY_PRIVATE_API_URL: 'Something2',
        FAKE_SEARCHIFY_ENV_VAR: 'Something3'
    },
    env2 = {
        GITHUB_PASSWORD: 'Something'
    },
    restify = {
        createJsonClient: function(trash){
            return {
                get: function(dummy, callback){
                    var response = {
                        statusCode: 200
                    };
                    callback(null, null, response, null);
                }
            }
        }
    },
    mongoose = {
        createConnection: function(url, db){
            return {
                on: function(dummy1, dummy2){
                    return;
                },
                model: function(modelName, schema){
                    return modelName;
                }
            }
        }
    },
    knox = {
        createClient: function(obj){
            return obj;
        }
    },
    github = require('octonode'),
    client = github.client({
        username: 'joebadmo',
        password: 'Something'
    }),
    repo = client.repo('joebadmo/patchwork'),
    fakeConf = {
        github: {
            user: 'joebadmo',
            repo: 'patchwork'
        },
        db: 'explicitDB'
    };

// Libarary to test
var config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify, mongoose: mongoose});

exports['test getConf'] = function(test){
    test.expect(5);
    var testConf = config.getConf('joebadmo', 'patchwork');
    test.equal(testConf.github.user, 'joebadmo');
    test.equal(testConf.github.repo, 'patchwork');
    test.equal(testConf.blog.path, 'blog');
    test.equal(testConf.assets.path, 'assets');

    var failConf = config.getConf('fake', 'shouldFail');
    test.equal(failConf, null);
    test.done();
};

exports['test configureGitHub'] = function (test) {
    config.configureGitHub(fakeConf);
    test.expect(6);
    test.equal(fakeConf.github.credentials.username, 'joebadmo');
    test.equal(fakeConf.github.credentials.password, 'Something');
    test.equal(fakeConf.github.ghrepo.name, client.repo('joebadmo/patchwork').name);
    test.equal(fakeConf.github.ghrepo.repo, client.repo('joebadmo/patchwork').repo);
    test.equal(fakeConf.github.ghrepo.credentials, client.repo('joebadmo/patchwork').credentials);
    test.equal(fakeConf.github.repoName, 'joebadmo/patchwork');
    test.done();
};

exports['test configureSearchify'] = {
    'no searchify': function(test){
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env2, restify: restify});
        config.configureSearchify(fakeConf);
        test.equal(fakeConf.searchify.url, null);
        test.equal(fakeConf.searchify.index, 'joebadmo-patchwork');
        test.done();
    },
    'default env var': function(test){
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify});
        config.configureSearchify(fakeConf);
        test.equal(fakeConf.searchify.url, 'Something2');
        test.equal(fakeConf.searchify.index, 'joebadmo-patchwork');
        test.done();
    },
    'explicit env var': function(test){
        fakeConf.searchify.private_api_env_var = 'FAKE_SEARCHIFY_ENV_VAR';
        config.configureSearchify(fakeConf);
        test.equal(fakeConf.searchify.url, 'Something3');
        test.equal(fakeConf.searchify.index, 'joebadmo-patchwork');
        test.done();
    }, 
    'explicit index': function(test){
        fakeConf.searchify.index = 'fakeIndex';
        config.configureSearchify(fakeConf);
        test.equal(fakeConf.searchify.index, 'fakeIndex');
        test.done();
    }
};

exports['test configureDatabase'] = {
    'explicit db name': function(test){
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.db, 'explicitDB');
        test.done();
    },
    'no db in conf': function(test){
        fakeConf.db = null;
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.db, 'joebadmo-patchwork');
        test.done();
    },
    'local dev env': function(test){
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify, mongoose: mongoose});
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.Doc, 'document');
        test.equal(fakeConf.Menu, 'menu');
        test.done();
    },
    'no blog': function(test){
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.Blog, null);
        test.done();
    },
    'blog': function(test){
        fakeConf.blog = 'fakeBlog';
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.Blog, 'blog');
        test.done();
    },
    'no matching db in VCAP_SERVICES': function(test){
        var vcap = JSON.stringify({
            'mongodb-1.8': [ { name: 'fakeDB'
                             , credentials: { url: null }
                             }
                           , { name: 'joebadmo-patchwork'
                             , credentials: { url: 'testURL' }
                             }
                           ]
        });
        env.VCAP_SERVICES = vcap;
        fakeConf.db = 'no-match';
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify, mongoose: mongoose});
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.mongoConnectionURI, 'localhost');
        test.equal(fakeConf.Doc, 'document');
        test.equal(fakeConf.Menu, 'menu');
        test.done();
    },
    'matching db in VCAP_SERVICES': function(test){
        fakeConf.db = null;
        config.configureDatabase(fakeConf);
        test.equal(fakeConf.mongoConnectionURI, 'testURL');
        test.equal(fakeConf.Doc, 'document');
        test.equal(fakeConf.Menu, 'menu');
        test.done();
    }
};

exports['test configureS3'] = {
    'no assets': function(test){
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets, null);
        test.done();
    },
    'just assets path': function(test){
        fakeConf.assets = 'fakeAssets';
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.path, 'fakeAssets');
        test.equal(fakeConf.assets.S3, null);
        test.done();
    },
    'no key and secret': function(test){
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.S3, null);
        test.done();
    },
    'default key and secret': function(test){
        env.S3_ACCESS_KEY = 'fakeKey';
        env.S3_SECRET = 'fakeSecret';
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify, mongoose: mongoose, knox: knox});
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.S3.key, 'fakeKey');
        test.equal(fakeConf.assets.S3.secret, 'fakeSecret');
        test.equal(fakeConf.assets.S3.client.key, 'fakeKey');
        test.equal(fakeConf.assets.S3.client.secret, 'fakeSecret');
        test.equal(fakeConf.assets.S3.client.bucket, 'joebadmo-patchwork');
        test.done();
    },
    'explicit key and secret': function(test){
        env.CUSTOM_S3_ACCESS_KEY = 'customFakeKey';
        env.CUSTOM_S3_SECRET = 'customFakeSecret';
        fakeConf.assets.S3.access_key_env_var = 'CUSTOM_S3_ACCESS_KEY';
        fakeConf.assets.S3.secret_env_var = 'CUSTOM_S3_SECRET';
        config = require('../lib/config')({configFile: './test/test-data/test.config.yml', env: env, restify: restify, mongoose: mongoose, knox: knox});
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.S3.key, 'customFakeKey');
        test.equal(fakeConf.assets.S3.secret, 'customFakeSecret');
        test.equal(fakeConf.assets.S3.client.key, 'customFakeKey');
        test.equal(fakeConf.assets.S3.client.secret, 'customFakeSecret');
        test.equal(fakeConf.assets.S3.client.bucket, 'joebadmo-patchwork');
        test.done();
    },
    'default bucket': function(test){
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.S3.bucket, 'joebadmo-patchwork');
        test.equal(fakeConf.assets.S3.client.bucket, 'joebadmo-patchwork');
        test.done();
    },
    'explicit bucket': function(test){
        fakeConf.assets.S3.bucket = 'fakebucket';
        config.configureS3(fakeConf);
        test.equal(fakeConf.assets.S3.bucket, 'fakebucket');
        test.equal(fakeConf.assets.S3.client.bucket, 'fakebucket');
        test.done();
    }
};

exports['test configureBlog'] = {
    'blog': function(test){
        fakeConf.blog = 'fakeBlogPath';
        config.configureBlog(fakeConf);
        test.equal(fakeConf.blog.path, 'fakeBlogPath');
        test.done();
    },
    'no blog': function(test){
        fakeConf.blog = null;
        config.configureBlog(fakeConf);
        test.equal(fakeConf.blog, null);
        test.done();
    }
};
