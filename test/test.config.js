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
                     , repo: { name: 'joebadmo/patchwork' }
                     }
                }
            , 'no username': 
                { github:
                    { credentials: 
                        { password: 'Password'
                        }
                    , user: 'joe'
                    , repo: { name: 'joebadmo/patchwork' }
                    }
                }
            , 'no password':
                { github:
                    { credentials: 
                        { username: 'joebadmo'
                        }
                    , user: 'joe'
                    , repo: { name: 'joebadmo/patchwork' }
                    }
                }
            };
    });

    describe( 'no config file', function(){
        beforeEach( function() {
            opts.configFilePath = 'something';
        });

        it( 'should throw an error', function(){
            should.throws( function(){
                config = require( confPath )( opts );
            }, Error );
        });
    });

    describe( 'github client configuration', function(){

        var mockClient, ghclient; 

        beforeEach( function(){
            mockClient = function( obj ) {
                var client = obj || {};
                client.repo = function(){};
                return client;
            };

            opts.octonode = { client: mockClient };
            opts.configFilePath = './config.yml.example';
        });

        it( 'should use given credentials for basic auth', function(){
            config = require( confPath )( opts );
            ghclient = config.buildGithubClient( mockConfigs['basic auth'] );
            ghclient.username.should.equal( 'badmo' );
            ghclient.password.should.equal( 'Password' );
        });

        it( 'should use github user if no username is specified', function(){
            config = require( confPath )( opts );
            ghclient = config.buildGithubClient( mockConfigs['no username'] );
            ghclient.username.should.equal( 'joe' );
            ghclient.password.should.equal( 'Password' );
        });

        it( 'should create client without auth if no password is supplied', function(){
            config = require( confPath )( opts );
            ghclient = config.buildGithubClient( mockConfigs['no password'] );
            should.not.exist( ghclient.username );
            should.not.exist( ghclient.password );
        });
    });

    describe( 'receivers configuration', function(){
        var receiverLib = require( '../lib/config/receivers.js' )
          , conf = {}
          , buildReceiverFn, receiverFn, receivers
          ;

        describe( 'receivers exist', function(){

            before( function(){

                receivers = { 'test1.js': function( rcvConf ) {
                                    return function( fileObj, cb ) {
                                        cb( null, fileObj + rcvConf.test1 );
                                    };
                                }
                            , 'test2.js': function( rcvConf ) {
                                    return function( fileObj, cb ) {
                                        cb( null, fileObj + rcvConf.test2 );
                                    };
                                }
                            };

                conf.receivers = [ { 'test1': 'conf1' }
                                 , { 'test2': 'conf2' }
                                 ];

                buildReceiverFn = receiverLib( receivers );
                receiverFn = buildReceiverFn( conf );

            });

            it( 'should return good receive function', function( done ) {

                receiverFn( 'test', function( err, results ){
                    should.not.exist( err );
                    results[ 0 ].should.equal( 'testconf1' );
                    results[ 1 ].should.equal( 'testconf2' );
                    done();
                });

            });
        });

        describe( 'receiver in conf, but file does not exist', function(){

            before( function(){

                receivers = { 'test1.js': function( rcvConf ) {
                                    return function( fileObj, cb ) {
                                        cb( null, fileObj + rcvConf.test1 );
                                    };
                                }
                            };

                conf.receivers = [ { 'test1': 'conf1' }
                                 , { 'test2': 'conf2' }
                                 ];

                buildReceiverFn = receiverLib( receivers );
                receiverFn = buildReceiverFn( conf );

            });

            it( 'should return good receive function, skipping missing conf', function( done ) {

                receiverFn( 'test', function( err, results ){
                    should.not.exist( err );
                    results.length.should.equal( 1 );
                    results[ 0 ].should.equal( 'testconf1' );
                    done();
                });

            });
        });

        describe( 'empty receiver list in conf', function(){

            before( function(){
                receivers = {};
                conf = {};
                buildReceiverFn = receiverLib( receivers );
                receiverFn = buildReceiverFn( conf );
            });

            it( 'should return good receive function that does nothing', function( done ){
                receiverFn( 'test', function( err ) {
                    should.not.exist( err );
                    done();
                });
            });
        });

    });

    describe( 'get()', function(){

        beforeEach( function(){
            opts.config = mockConfigs[ 'base' ];
            config = require( confPath )( opts );
        });

        it( 'should return the configuration object for the given user and repo', function(){
            var conf = config.get( 'joebadmo', 'patchwork' );
            conf.should.be.a( 'object' );
            conf.github.user.should.equal( 'joebadmo' );
            conf.github.repo.should.equal( 'patchwork' );
        })

        it( 'should return undefined if no matching conf exists', function(){
            var badRepo, badUser;
            try {
                badRepo = config.get( 'joebadmo', 'workpatch' );
            } catch ( error ) {
                error.message.should.equal( 'No configuration for user "joebadmo" and repo "workpatch".' );
            }
            try {
                badUser = config.get( 'joegoodmo', 'patchwork' );
            } catch ( error ) {
                error.message.should.equal( 'No configuration for user "joegoodmo" and repo "patchwork".' );
            }
            should.not.exist( badRepo );
            should.not.exist( badUser );
        });
    })
});
