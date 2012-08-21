var yaml = require('yamlparser');
var request = require('request');
var Converter = require("./lib/pagedown/Markdown.Converter").Converter;
var converter = new Converter();
var restify = require('restify');
var github = require('octonode');
var express = require('express');
var app = express.createServer();
app.use(express.logger());
var searchifyURL = process.env.SEARCHIFY_PRIVATE_API_URL;
var client = github.client();
var repoName = 'joebadmo/afdocs-test';
var ghrepo = client.repo(repoName);

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.get('/index', function(req, res){
    console.log('index request received');
	var rootPath = '/';

	parsePath( rootPath, ghrepo );
	res.send( "index request received for " + repoName );
});

function parsePath( path, ghrepo ) {
	ghrepo.contents(path, function (err, data) {

		for ( i = 0; i < data.length; i++ ) {

			// ignore dotfiles
			if ( data[i].path[0] !== '.' ) {

				if ( data[i].type === 'file' ) {

					parseContent( data[i].path, ghrepo, function ( fileObj ) {
						//indexDoc( fileObj );
					});

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo );

				}

			}
		}
	});
}

function parseContent ( path, ghrepo, callback ) {

	var rawHeader = { Accept: 'application/vnd.github.beta.raw+json' };
	var rawPath = "https://api.github.com/repos/joebadmo/afdocs-test/contents/" + path;
	var options = {
		uri: rawPath,
		headers: rawHeader
	};

	request( options, function (error, rawContent, body) {

		var tempObj = yamlFront( rawContent.body );//(new Buffer(data.content, 'base64').toString('ascii'))); 
		var parsedObj = {
			title: tempObj.attributes.title,
			path: path.replace(".markdown","").replace("index",""),
			content: converter.makeHtml( tempObj.body )
		};

		console.log( "Indexed " + path );
		callback ( parsedObj );

	});	
	


}

function yamlFront ( input ) {
	//regex to find yaml front matter
	var regex = /^\s*---[\s\S]+?---\s*/gi;
	var match = regex.exec( input );
	var yamlString = match[0];
    var attributes = yaml.eval( yamlString );
	var body = input.replace( match[0], '' );
	if ( body.length === 0 ) { body = "hello"; }
	var parsedObj = {
		attributes: attributes,
		body: body
	};
	return parsedObj;

}

function indexDoc ( fileObj ) {
	var client = restify.createJsonClient({
		url: searchifyURL
	});

	client.put('/v1/indexes/idx/docs', {docid: fileObj.path, fields: { text: fileObj.content, title: fileObj.title } }, function(err, req, res, obj) {
	});

}

app.listen(process.env.VCAP_APP_PORT || 3000);
