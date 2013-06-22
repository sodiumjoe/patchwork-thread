var express = require( 'express' )
  , app = express()
  , routes = require( './routes' )( app )
  ;

app.use( express.logger() );
app.configure(function(){
    app.use( express.methodOverride() );
    app.use( express.bodyParser() );
    app.use( app.router );
    app.use( express.logger() );
});

app.listen( process.env.VCAP_APP_PORT || 4000 );
