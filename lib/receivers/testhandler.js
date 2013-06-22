module.exports = function( fileObj, callback ) {
    console.log( 'testhandler: ' + fileObj.path );
    callback( null );
};
