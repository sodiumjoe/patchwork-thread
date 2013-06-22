module.exports = function( conf ) {
    var getContentObj
      , indexFile
      ;

    getContentObj = function( path, callback ) {
        conf.github.client.getContent( path, function( err, rawContent ) {
            if ( err ) { return callback ( err ); }
            try {
                var parsedObj = conf.parse( rawContent );
            } catch( e ) {
                if ( e ) { return callback ( e ); }
            }
            callback( null, parsedObj );
        });
    };

    indexFile = function( path, callback ) {
        console.info( 'indexing file: ' + path );
        getContentObj( path, function( err, fileObj ) {
            console.info( fileObj );
            callback( null );
            //conf.database.save( fileObj, callback );
        });
    };

    return { getContentObj: getContentObj
           , indexFile: indexFile
           }; 
};
