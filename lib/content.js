module.exports = function( conf ) {
    var _ = require( 'underscore' )
      , async = require( 'async' )
      , yaml = require('js-yaml')
      , decodeBase64
      , extractYamlFront
      , parseYamlFront
      , formatContentObj
      , parseFile
      , indexFile
      , indexList
      , indexAll
      ;

    decodeBase64 = function( encoded ) {
        return new Buffer(encoded, 'base64').toString('utf8');
    };

    extractYamlFront = function( rawString ) {
        var frontMatterRegex = /^\s*---[\s\S]+?---\s*/gi
          , leadingWhiteSpaceRegex = /^\s*/
          , trailingWhiteSpaceRegex = /\s*$/
          , match, yamlString, body
          ;

        match = frontMatterRegex.exec( rawString );

        if ( !match ) { 
            return new Error; 
        }

        yamlString = match[ 0 ].replace( /---/g, '' ).replace( leadingWhiteSpaceRegex, '' ).replace( trailingWhiteSpaceRegex, '' );
        body = rawString.replace( match[ 0 ], '' ).replace( leadingWhiteSpaceRegex, '' ).replace( trailingWhiteSpaceRegex, '' );

        return { yamlString: yamlString
               , body: body
               };
    };

    parseYaml = function( yamlString ) {
        return yaml.load(yamlString);
    };

    formatContentObj = function( ghresponse, head, body ) {
        var obj = head;
        obj.body = body;
        obj.path = ghresponse.path;
        return obj;
    };

    parseFile = function( path, callback ) {
        getContent( path, function( err, rawContent ) {
            var decodedStr, extractedObj, head, body, contentObj;

            decodedStr = decodeBase64( rawContent.content );
            extractedObj = extractYamlFront( decodedStr );
            head = parseYaml( extractedObj.yamlString );
            body = extractedObj.body;
            contentObj = formatContentObj( rawContent, head, body );

            callback( null, contentObj );
        });
    };

    indexFile = function( path, callback ) {
        parseFile( path, function( err, fileObj ) {
            console.info( 'indexing file: ' + fileObj.path );
            console.info( fileObj );
            callback( null );
            //conf.database.save( fileObj, callback );
        });
    };

    indexFiles = function( list, callback ) {
        async.each( list, indexFile, callback );
    };

    indexAll = function( callback ) {
        getRootSha( function( err, sha ) {
            if ( err ) { return callback( err ); }
            getFileList( sha, function( err, list ) {
                if ( err ) { return callback( err ); }
                indexFiles( list, callback );
            });
        });
    };

    return { getRootSha: getRootSha
           , getFileList: getFileList
           , getContent: getContent
           , decodeBase64: decodeBase64
           , extractYamlFront: extractYamlFront
           , parseYaml: parseYaml
           , formatContentObj: formatContentObj
           , parseFile: parseFile
           , indexFile: indexFile
           , indexFiles: indexFiles
           , indexAll: indexAll
           };
};
