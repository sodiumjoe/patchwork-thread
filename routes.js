var content = require( './lib/content' );

module.exports = function( app ) {

    app.get( '/', function( req, res ) {
        res.send( "Patchwork Thread v. 0.0.1" );
    });

    app.post( '/github', function( req, res ) {
        console.log( 'post received' );
    });

    app.get( '/index/:user/:repo', function( req, res ) {
        content(req, res);
    });

};
