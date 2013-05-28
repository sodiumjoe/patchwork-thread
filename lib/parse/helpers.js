module.exports = (function(){
    var yaml = require( 'js-yaml' )
      , decodeBase64
      , extractYamlFront
      , parseYamlFront
      , formatContentObj
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

    return { decodeBase64: decodeBase64
           , extractYamlFront: extractYamlFront
           , parseYaml: parseYaml
           , formatContentObj: formatContentObj
           };
})();
