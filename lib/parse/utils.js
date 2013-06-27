module.exports = ( function(){
    var yaml = require( 'js-yaml' )
      , pagedown = require( 'pagedown' )
      , converter = new pagedown.Converter()
      ;

    function decodeBase64 ( encoded ) {
        return new Buffer(encoded, 'base64').toString('utf8');
    }

    function extractYamlFront( rawString ) {
        var frontMatterRegex = /^\s*---[\s\S]+?---\s*/gi
          , leadingWhiteSpaceRegex = /^\s*/
          , trailingWhiteSpaceRegex = /\s*$/
          , match, yamlString, body
          ;

        match = frontMatterRegex.exec( rawString );

        if ( !match ) {
            return new Error();
        }

        yamlString = match[ 0 ].replace( /---/g, '' ).replace( leadingWhiteSpaceRegex, '' ).replace( trailingWhiteSpaceRegex, '' );
        body = rawString.replace( match[ 0 ], '' ).replace( leadingWhiteSpaceRegex, '' ).replace( trailingWhiteSpaceRegex, '' );

        return { yamlString: yamlString
               , body: body
               };
    }

    function parseYaml( yamlString ) {
        return yaml.load(yamlString);
    }

    function convertMD ( markdownString ) {
        var idRegex, html;
        /* This is to parse non-standard markdown syntax of elements with trailing {#example} into an id on the element e.g.:
         * ### Hi{#hello} becomes <h3 id="hello">Hi</h3>
         */
        idRegex = /(<h\d)(>)(.+?){#([\S\w]+?)}(<\/h\d>)/g;
        html = converter.makeHtml( markdownString );
        return html.replace(idRegex, "$1 id=" + '"' + "$4" + '"' + "$2$3$5");
    }

    function formatContentObj ( ghresponse, head, body ) {
        var obj = head;
        obj.body = body;
        obj.path = ghresponse.path;
        return obj;
    }

    return { decodeBase64: decodeBase64
           , extractYamlFront: extractYamlFront
           , parseYaml: parseYaml
           , convertMD: convertMD
           , formatContentObj: formatContentObj
           };
})();
