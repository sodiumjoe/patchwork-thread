var mongoose = require( 'mongoose' )
  , async = require( 'async' )
  , utilsLib = require( './utils' )
  ;

module.exports = function( conf ) {

    if ( typeof conf === 'string' ) {
        conf = { mongo: null };
    }

    conf.mongoose = mongoose;

    var utils = utilsLib( conf );

    return { save: utils.save
           , remove: utils.remove
           };

};
