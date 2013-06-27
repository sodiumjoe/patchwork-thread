module.exports = function( conf ){

    var async = require( 'async' )
      , models = {}
      , conn = getConnString()
      , db
      ;

    conf.mongoose.connect( conn );
    db = conf.mongoose.connection;

    db.on( 'error', console.error.bind( console, 'MongoDB Connection Error:') );

    db.once( 'open', function() {
        console.info( 'Connected to MongoDB: ' + conn );
    });


    /* Schemas */

    var docSchema = new conf.mongoose.Schema({ title:    String
                                        , body:     String
                                        , category: String
                                        , path:     String
                                        , redirect: String
                                        , tags:     []
                                        });


    /* Models */

    models.Doc = conf.mongoose.model( 'Doc', docSchema );


    /* Functions */

    function getConnString(){

        if ( conf.mongo && conf.mongo.connection ) {
            return conf.mongo.connection;
        }

        return 'mongodb://localhost/test';
    }

    function save( fileObj, callback ) {
        var Model = models[ fileObj.model ];
        remove( fileObj, function( err ) {
            if ( err ) { return callback( err ); }
            return new Model( fileObj ).save( callback );
        });
    }

    function remove( fileObj, callback ) {
        var Model = models[ fileObj.model ];
        Model.find( { path: fileObj.path }, function( err, docs ) {
            if ( docs ) {
                async.each( docs, function( doc, callback ) {
                    doc.remove( callback );
                }, callback );
            } else {
                return callback( null );
            }
        });
    }

    return { conn: conn
           , save: save
           , remove: remove
           };
};
