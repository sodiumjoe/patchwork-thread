var should = require('should')
  , assert = require('assert')
  ;

describe( 'lib/config.js', function(){

    var config, confPath, opts, mockConfigs;
    confPath = '../lib/config';

    beforeEach( function(){
        opts = {};
        mockConfigs = 
            { 'base':
                { github:
                    { user: 'joebadmo'
                    , repo: 'patchwork'
                    }
                }
            , 'basic auth':
                { github:
                     { credentials: 
                         { username: 'badmo'
                         , password: 'Password'
                         }
                     , user: 'joe'
                     , repo: 'patchwork'
                     }
                }
            , 'no username': 
                { github:
                    { credentials: 
                        { password: 'Password'
                        }
                    , user: 'joe'
                    , repo: 'patchwork'
                    }
                }
            , 'no password':
                { github:
                    { credentials: 
                        { username: 'joebadmo'
                        }
                    , user: 'joe'
                    , repo: 'patchwork'
                    }
                }
            };
    });

    describe( 'github client configuration', function(){
        var mockClient, ghclient; 

        beforeEach( function(){
            mockClient = function( obj ) {
                var client = obj || {};
                client.repo = function(){};
                return client;
            };

            opts.github = { client: mockClient };
        });

        it( 'should use given credentials for basic auth', function(){
            config = require( confPath )( opts );
            ghclient = config.getGithubClient( mockConfigs['basic auth'] );
            ghclient.username.should.equal( 'badmo' );
            ghclient.password.should.equal( 'Password' );
        });

        it( 'should use github user if no username is specified', function(){
            config = require( confPath )( opts );
            ghclient = config.getGithubClient( mockConfigs['no username'] );
            ghclient.username.should.equal( 'joe' );
            ghclient.password.should.equal( 'Password' );
        });

        it( 'should create client without auth if no password is supplied', function(){
            config = require( confPath )( opts );
            ghclient = config.getGithubClient( mockConfigs['no password'] );
            should.not.exist( ghclient.username );
            should.not.exist( ghclient.password );
        });
    });

    describe( 'get()', function(){

        beforeEach( function(){
            opts.config = mockConfigs['base'];
            config = require( confPath )( opts );
        });

        it( 'should return the configuration object for the given user and repo', function(){
            var conf = config.get( 'joebadmo', 'patchwork' );
            conf.should.be.a('object');
            conf.github.user.should.equal('joebadmo');
            conf.github.repo.should.equal('patchwork');
        })

        it( 'should return undefined if no matching conf exists', function(){
            should.not.exist(config.get( 'joebadmo', 'workpatch' ) );
            should.not.exist(config.get( 'joegoodmo', 'patchwork' ) );
        });
    })
});
