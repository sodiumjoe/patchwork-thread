var helpers = require( './helpers' );

module.exports = function( rawContent ) {

    var decodedStr, extractedObj, head, body, contentObj;

    decodedStr = helpers.decodeBase64( rawContent.content );
    extractedObj = helpers.extractYamlFront( decodedStr );
    head = helpers.parseYaml( extractedObj.yamlString );
    body = extractedObj.body;
    contentObj = helpers.formatContentObj( rawContent, head, body );

    return contentObj;

};
