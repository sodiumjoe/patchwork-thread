var async = require( 'async' )
  , _ = require( 'underscore' )
  ;

module.exports = function( receivers ) {

    return function( conf ) {

        var tmpReceivers = []
          , action, save, remove
          ;

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

        action = function( fileObj, method, callback ) {
            var mappedReceivers = _.map( tmpReceivers, function( rcv ) {
                return function( callback ) {
                    rcv[ method ]( fileObj, callback );
                };
            });

            async.parallel( mappedReceivers, callback );
        };

        save = function( fileObj, callback ) {
            database( fileObj, 'save', callback);
        };

        remove = function( fileObj, callback ) {
            database( fileObj, 'remove', callback);
        };

        return { save: save
               , remove: remove
               };

    };
};
