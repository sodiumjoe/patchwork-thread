module.exports = function( conf ) {
    var getContentObj
      , indexFile
      , getModel
      ;

    getContentObj = function( path, callback ) {
        conf.github.client.getContent( path, function( err, rawContent ) {
            if ( err ) { return callback ( err ); }
            try {
                var parsedObj = conf.parse( rawContent );
                parsedObj.model = getModel( conf, path );
            } catch( e ) {
                if ( e ) { return callback ( e ); }
            }
            callback( null, parsedObj );
        });
    };

    indexFile = function( path, callback ) {
        console.info( 'indexing file: ' + path );
        getContentObj( path, function( err, fileObj ) {
            console.info( fileObj.path );
            conf.receive.save( fileObj, callback );
        });
    };

    getModel = function( conf, path ) {

        if ( path.slice( conf.blog.length ) === conf.gblo ) {
            return 'Blog';
        }

        return 'Doc';
    };

    return { getContentObj: getContentObj
           , indexFile: indexFile
           };
};
