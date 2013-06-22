module.exports = function( conf ) {
    // take connection info from conf
    // create db Models, etc.
    return function( fileObj, callback ) {
        // check for existence of entry, update or create
        console.log( 'file handled: ' + fileObj.path );
        callback( null );
    };

};
