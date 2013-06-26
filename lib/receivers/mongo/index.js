var mongoose = require( 'mongoose' )
  , async = require( 'async' )
    ;

module.exports = function( conf ) {

    /* DB Connection */

    var conn = conf.connection || 'mongodb://localhost/test'
      , models = {}
      , db, save, remove
      ;

    mongoose.connect( conn );
    db = mongoose.connection;

    db.on( 'error', console.error.bind( console, 'connection error:') );

    db.once( 'open', function() {
        console.info( 'Connected to MongoDB: ' + conn );
    });


    /* Schemas */

    var docSchema = new mongoose.Schema({ title: String
                                        , body: String
                                        , category: String
                                        , path: String
                                        , redirect: String
                                        , tags: []
                                        });


    /* Models */

    models[ 'Doc' ] = mongoose.model( 'Doc', docSchema );


    /* Functions */

    function save( fileObj, callback ) {
        var Model = models[ fileObj.model ];
        remove( fileObj, function( err ) {
            if( err ) { return callback( err ); }
            return new Model( fileObj ).save( callback );
        });
    };

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

    };

    return { save: save
           , remove: remove
           };

};
