var should = require( 'should' )
  , assert = require( 'assert' )
  , sinon = require( 'sinon' )
  , contentLib = require( '../lib/content' )
  , mockConfigs
  ;

describe( 'lib/content.js', function(){
    beforeEach( function(){
        mockConfigs = { 'base': { 'github': { 'client': { 'getContent': function( path, callback ) {
                                                              callback( null, 'foo' );
                                                            }
                                                        }
                                            }
                                , 'parse': function( rawContent ) {
                                        return rawContent;
                                    }
                                }
                      , 'getContentError': { 'github': { 'client': { 'getContent': function( path, callback ) {
                                                              callback( path );
                                                            }
                                                        }
                                            }
                                , 'parse': function( rawContent ) {
                                        return rawContent;
                                    }
                                }
                      , 'parseError': { 'github': { 'client': { 'getContent': function( path, callback ) {
                                                              callback( null, path );
                                                            }
                                                        }
                                            }
                                , 'parse': function( rawContent ) {
                                        throw new Error('error!');
                                    }
                                }
                      };

        sinon.spy( mockConfigs[ 'base' ].github.client, 'getContent' );
        sinon.spy( mockConfigs[ 'base' ], 'parse' );
        sinon.spy( mockConfigs[ 'getContentError' ].github.client, 'getContent' );
        sinon.spy( mockConfigs[ 'getContentError' ], 'parse' );
        sinon.spy( mockConfigs[ 'parseError' ].github.client, 'getContent' );
        sinon.spy( mockConfigs[ 'parseError' ], 'parse' );
    });

    describe( 'getContentObj()', function(){

        it( 'should call conf.github.client.getContent() and conf.parse()', function( done ) {
            var input = 'whatevs';
            contentLib( mockConfigs[ 'base' ] ).getContentObj( input, function( err, obj ){
                assert( mockConfigs[ 'base' ].github.client.getContent.calledOnce );
                assert( mockConfigs[ 'base' ].parse.calledOnce );
                should.not.exist( err );
                obj.should.equal( 'foo' );
                done();
            });
        });

        it( 'should propagate error from conf.github.client.getContent()', function( done ) {
            var input = 'error!';
            contentLib( mockConfigs[ 'getContentError' ] ).getContentObj( input, function( err, obj ){
                assert( mockConfigs[ 'getContentError' ].github.client.getContent.calledOnce );
                assert( mockConfigs[ 'getContentError' ].parse.notCalled );
                should.not.exist( obj );
                done();
            });
        });

        it( 'should propagate error from conf.parse()', function( done ) {
            var input = 'error!';
            contentLib( mockConfigs[ 'parseError' ] ).getContentObj( input, function( err, obj ){
                assert( mockConfigs[ 'parseError' ].github.client.getContent.calledOnce );
                assert( mockConfigs[ 'parseError' ].parse.calledOnce );
                err.message.should.equal( 'error!' );
                should.not.exist( obj );
                done();
            });
        });

    });
});

