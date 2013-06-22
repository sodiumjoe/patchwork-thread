var async = require( 'async' )
  , _ = require( 'underscore' )
  ;

module.exports = function( receivers ) {

    return function( conf ) {

        var tmpReceivers = [];
        conf.receivers = conf.receivers || [];

        conf.receivers.forEach( function( rcv ) {

            var key = Object.keys( rcv ).shift() + '.js';

            if ( receivers[ key ] ) {
                try {
                    return tmpReceivers.push( receivers[ key ]( rcv ) );
                } catch ( e ) {
                    return console.error( e );
                }
            }

            return console.error( 'Config error: receiver file "' + key + '" does not exist' );

        });

        return function( fileObj, callback ) {
            var mappedReceivers = _.map( tmpReceivers, function( rcv ) {
                return function( callback ) {
                    rcv( fileObj, callback );
                };
            });

            async.parallel( mappedReceivers, callback );
        };
    };
};
