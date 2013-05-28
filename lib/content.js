module.exports = function( conf ) {
    var async = require( 'async' )
      , getContentObj
      , indexFile
      , indexList
      , indexAll
      ;

    getContentObj = function( path, callback ) {
        conf.github.client.getContent( path, function( err, rawContent ) {
            if ( err ) { return callback ( err ); }
            var parsedObj = conf.parse( rawContent );
            callback( null, parsedObj );
        });
    };

    indexFile = function( path, callback ) {
        getContentObj( path, function( err, fileObj ) {
            console.info( 'indexing file: ' + fileObj.path );
            console.info( fileObj );
            callback( null );
            //conf.database.save( fileObj, callback );
        });
    };

    indexFiles = function( list, callback ) {
        async.each( list, indexFile, callback );
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

    return { getContentObj: getContentObj
           , indexFile: indexFile
           , indexFiles: indexFiles
           , indexAll: indexAll
           };
};
