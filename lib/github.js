module.exports = function( client ) {
    var _ = require( 'underscore' )
      , getRootSha
      , getFileList
      , getContent
      ;

    getRootSha = function( callback ) {
        client.commits( function( err, commits ) {
            if ( err ) { return callback( err ); }
            callback( null, commits[0].sha );
        });
    };

    getFileList = function( sha, callback ) {
        client.tree( sha, true, function( err, tree ) {
            var list, pathList;
            if ( err ) { return callback( err ); }
            list = tree.tree.filter( isFile )
                            .filter( isNotDotfile )
                            .filter( isMarkdownFile )
                            .filter( isNotReadme );
            pathList = _.pluck( list, 'path' );
            callback( null, pathList );
        });

        function isFile( item ) {
            return item.type === 'blob';
        }

        function isNotDotfile( item ) {
            var pathArr = item.path.split( '/' );
            return pathArr[ pathArr.length - 1 ].substring( 0, 1 ) !== '.';
        }

        function isMarkdownFile( item ) {
            return item.path.toLowerCase().substring( item.path.length - 9 ) === '.markdown' || item.path.toLowerCase().substring( item.path.length - 3 ) === '.md';
        }

        function isNotReadme( item ) {
            return item.path.toLowerCase().substring(0,6) !== 'readme';
        }
    };

    getContent = function( path, callback ) {
        client.contents( path, callback );
    };

    return { getRootSha: getRootSha
           , getFileList: getFileList
           , getContent: getContent
           };
};
