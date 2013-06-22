var config = require( './lib/config' )()
  , content = require( './lib/content' )
  ;

module.exports = function( app ) {

    app.get( '/', function( req, res ) {
        res.send( "Patchwork Thread v. 0.0.1" );
    });

    app.post( '/github', function( req, res ) {
        console.log( 'post received' );
    });

    app.get( '/index/:user/:repo', function( req, res ) {
        var conf;

        try {
            conf = config.get( req.params.user, req.params.repo );
        } catch ( e ) {
            res.send( 404, e.message );
        }

        content( conf ).indexAll( function( err ) {
            if ( err ) { res.send ( 500, err ); }
            res.send ( 'done' );
        });
    });
};
