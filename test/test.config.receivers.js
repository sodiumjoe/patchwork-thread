var should = require('should')
  , assert = require('assert')
  ;

// mute logging
console.error = function(){
};

describe( 'lib/config/receivers.js', function(){

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
});
