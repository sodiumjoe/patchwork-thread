var should = require('should')
  , assert = require('assert')
  ;

describe( 'lib/config.js', function(){
    var config, confPath;

    confPath = '../lib/config';

    describe( 'github client configuration', function(){
        describe( 'should create github client properly', function(){
            var opts = {}, mockClient, mockConfig, ghclient; 

            mockClient = function( obj ) {
                var client = obj || {};
                client.repo = function(){};
                return client;
            };

            opts.github = { client: mockClient
                          };
            opts.config = { github:
                                { user: 'joebadmo'
                                , repo: 'patchwork'
                                }
                          };

            it( 'should use given credentials for basic auth', function(){
                mockConfig = { github:
                                   { credentials: 
                                         { username: 'badmo'
                                         , password: 'Password'
                                         }
                                   , user: 'joe'
                                   , repo: 'patchwork'
                                   }
                             };

                config = require( confPath )( opts );
                ghclient = config.getGithubClient( mockConfig );
                ghclient.username.should.equal( 'badmo' );
                ghclient.password.should.equal( 'Password' );
            });

            it( 'should use github user if no username is specified', function(){
                mockConfig = { github:
                                   { credentials: 
                                         { password: 'Password'
                                         }
                                   , user: 'joe'
                                   , repo: 'patchwork'
                                   }
                             };

                config = require( confPath )( opts );
                ghclient = config.getGithubClient( mockConfig );
                ghclient.username.should.equal( 'joe' );
                ghclient.password.should.equal( 'Password' );
            });

            it( 'should create client without auth if no password is supplied', function(){
                mockConfig = { github:
                                   { credentials: 
                                         { username: 'joebadmo'
                                         }
                                   , user: 'joe'
                                   , repo: 'patchwork'
                                   }
                             };

                config = require( confPath )( opts );
                ghclient = config.getGithubClient( mockConfig );
                should.not.exist( ghclient.username );
                should.not.exist( ghclient.password );
            });
        });
    });

    describe( 'get()', function(){
        config = require( confPath )({ 
            config: { github:
                          { user: 'joebadmo'
                          , repo: 'patchwork'
                          }
                    }
        });
        it( 'should return the configuration object for the given user and repo', function(){
            var conf = config.get( 'joebadmo', 'patchwork' );
            conf.should.be.a('object');
        })
    })

})
