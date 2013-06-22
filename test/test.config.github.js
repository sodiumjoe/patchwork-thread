var should = require('should')
  , assert = require('assert')
  , githubConf = require( '../lib/config/github' )
  , mockConfig = {} 
  , mockClient, octonode, ghclient, buildGithubClient
  ;

describe( 'lib/config/github.js', function(){

    beforeEach( function(){

        mockClient = function( obj ) {
            var client = obj || {};
            client.repo = function(){};
            return client;
        };

        octonode = { client: mockClient };

        buildGithubClient = githubConf( octonode );

    });

    describe( 'basic auth', function(){

        before( function() {
            mockConfig.github = { credentials: 
                                    { username: 'badmo'
                                    , password: 'Password'
                                    }
                                , user: 'joe'
                                , repo: { name: 'joebadmo/patchwork' }
                                };

        });

        it( 'should use given credentials for basic auth', function(){
            ghclient = buildGithubClient( mockConfig );
            ghclient.username.should.equal( 'badmo' );
            ghclient.password.should.equal( 'Password' );
        });

    });

    describe( 'no username', function(){

        before( function(){
            mockConfig.github = { credentials: { password: 'Password' }
                                , user: 'joe'
                                , repo: { name: 'joebadmo/patchwork' }
                                };
        });

        it( 'should use github user if no username is specified', function(){
            ghclient = buildGithubClient( mockConfig );
            ghclient.username.should.equal( 'joe' );
            ghclient.password.should.equal( 'Password' );
        });

    });

    describe( 'no password', function(){

        before( function(){
            mockConfig.github = { credentials: { username: 'joebadmo' }
                                , user: 'joe'
                                , repo: { name: 'joebadmo/patchwork' }
                                };
        });

        it( 'should create client without auth if no password is supplied', function(){
            ghclient = buildGithubClient( mockConfig );
            should.not.exist( ghclient.username );
            should.not.exist( ghclient.password );
        });

    });

});
