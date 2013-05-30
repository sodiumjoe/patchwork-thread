var utils = require( './utils' );

module.exports = function( rawContent ) {

    var decodedStr, extractedObj, head, body, contentObj;

    decodedStr = utils.decodeBase64( rawContent.content );
    extractedObj = utils.extractYamlFront( decodedStr );
    head = utils.parseYaml( extractedObj.yamlString );
    body = utils.convertMD( extractedObj.body );
    contentObj = utils.formatContentObj( rawContent, head, body );

    return contentObj;

};
