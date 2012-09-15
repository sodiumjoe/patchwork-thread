var yaml = require('yamlparser');

exports.parse = function ( input ) {
	//regex to find yaml front matter
	var regex = /^\s*---[\s\S]+?---\s*/gi;
	var match = regex.exec( input );
	if ( match ) {
		var yamlString = match[0];
		var attributes = yaml.eval( yamlString );
		var body = input.replace( match[0], '' );
		var parsedObj = {
			attributes: attributes,
			body: body
		};
	} else {
		var parsedObj = { 
			body: input,
			attributes: {
				title: 
			}
		};
	}
	return parsedObj;

}
