module.exports = function( conf ) {
    var async = require( 'async' )
      , utils = require( './utils.js' )( conf )
      , indexFiles
      , indexAll
      ;

    indexFiles = function( list, callback ) {
        async.each( list, utils.indexFile, callback );
    };

    indexAll = function( callback ) {
        conf.github.client.getRootSha( function( err, sha ) {
            if ( err ) { return callback( err ); }
            conf.github.client.getFileList( sha, function( err, list ) {
                if ( err ) { return callback( err ); }
                indexFiles( list, callback );
            });
        });
    };

    return { indexFiles: indexFiles
           , indexAll: indexAll
           };
};
