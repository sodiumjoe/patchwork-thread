var fakeEnvironment = {
        GITHUB_PASSWORD: 'Something',
        SEARCHIFY_PRIVATE_API_URL: 'Something2'
    },
    fakeEnvironment2 = {
        GITHUB_PASSWORD: 'Something'
    },
    fakeRestify = {
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
    };

// Libarary to test
var config = require('../lib/config')('./test/test-data/test.config.yml', fakeEnvironment, fakeRestify);

exports['test getConf'] = function(test){
    test.expect(5);
    config.getConf('joebadmo', 'patchwork', function(err, conf){
        test.equal(conf.github.user, 'joebadmo');
        test.equal(conf.github.repo, 'patchwork');
        test.equal(conf.blog.path, 'blog');
        test.equal(conf.assets.path, 'assets');

        config.getConf('fake', 'shouldFail', function(err, conf){
            test.equal(err, "Error: github username and repo name do not match any conf in config.json");
            test.done();
        });
    });
};

exports['test configureGitHub'] = function (test) {
    var github = require('octonode'),
        client = github.client({
            username: 'joebadmo',
            password: 'Something'
        }),
        repo = client.repo('joebadmo/patchwork'),
        fakeConf = {
        github: {
            user: 'joebadmo',
            repo: 'patchwork'
        }
    };
    config.configureGitHub(fakeConf, function(err){
        test.expect(6);
        test.equal(fakeConf.github.credentials.username, 'joebadmo');
        test.equal(fakeConf.github.credentials.password, 'Something');
        test.equal(fakeConf.github.ghrepo.name, client.repo('joebadmo/patchwork').name);
        test.equal(fakeConf.github.ghrepo.repo, client.repo('joebadmo/patchwork').repo);
        test.equal(fakeConf.github.ghrepo.credentials, client.repo('joebadmo/patchwork').credentials);
        test.equal(fakeConf.github.repoName, 'joebadmo/patchwork');
        test.done();
    });
};

exports['test configureSearchify'] = {
    'no searchify': function(test){
        config = require('../lib/config')('./test/test-data/test.config.yml', fakeEnvironment2, fakeRestify);
        var fakeConf = {
            github: {
                user: 'joebadmo',
                repo: 'patchwork'
            }
        };
        config.configureSearchify(fakeConf, function(err, result){
            test.equal(result[0], 'Missing searchify credentials.');
            test.equal(fakeConf.searchify.url, null);
            test.done();
        });
    },
    'default env var': function(test){
        config = require('../lib/config')('./test/test-data/test.config.yml', fakeEnvironment, fakeRestify);
        var fakeConf = {
            github: {
                user: 'joebadmo',
                repo: 'patchwork'
            }
        };
        config.configureSearchify(fakeConf, function(err, result){
            test.equal(fakeConf.searchify.url, 'Something2');
            test.done();
        });
    }
};

/*
        getConf: getConf,
        configureGitHub: configureGitHub,
        configureSearchify: configureSearchify,
        configureDatabase: configureDatabase,
        configureS3: configureS3,
        configureBlog: configureBlog
*/
