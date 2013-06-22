var should = require('should')
  , assert = require('assert')
  ;

describe( 'lib/config/index.js', function(){

    var confPath = '../lib/config'
      , config, opts, mockConfig
      ;

    beforeEach( function(){
        opts = {};
        opts.config = { github:
                          { user: 'joebadmo'
                          , repo: 'patchwork'
                          }
                      };
    });

    describe( 'no config file', function(){
        beforeEach( function() {
            opts = {};
            opts.configFilePath = 'foo';
        });

        it( 'should throw an error', function(){
            should.throws( function(){
                config = require( confPath )( opts );
            }, Error );
        });
    });

    describe( 'get()', function(){

        beforeEach( function(){
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
