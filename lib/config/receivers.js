var async = require( 'async' )
  , _ = require( 'underscore' )
  ;

module.exports = function( receivers ) {

    return function( conf ) {

        var tmpReceivers = [];
        conf.receivers = conf.receivers || [];

        conf.receivers.forEach( function( rcv ) {

            var key = typeof( rcv ) === 'string' ? rcv : Object.keys( rcv ).shift();

            if ( receivers[ key ] ) {
                try {
                    return tmpReceivers.push( receivers[ key ]( rcv ) );
                } catch ( e ) {
                    return console.error( e );
                }
            }

            if ( receivers[ key + '.js' ] ) {
                try {
                    return tmpReceivers.push( receivers[ key + '.js' ]( rcv ) );
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
