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

app.post('/pusher', function(req, res){
    console.log('post received');
    try {
		p = req.body.payload;
		console.log(p);

		var obj = JSON.parse(p);

		var lastCommit = obj.commits[ obj.commits.length - 1 ];
		
		console.log( "Last commit: \n" + lastCommit.id );

		var updates = lastCommit.added.concat( lastCommit.modified );

		var removed = lastCommit.removed;

		console.log ( "Updating: \n " + updates.toString() );
		for ( i = 0; i < updates.length; i++ ) {
			parseContent( updates[i], ghrepo, function ( fileObj ) {
				console.log ( "Added or modified: \n" );
				indexDoc( fileObj );
			});
		}

		console.log ( "Removing: \n " + removed );
		for ( i = 0; i < removed.length; i++ ) {
			deindexDoc( removed[i].replace(".markdown","").replace("index","") );
		}

    } catch (err) {
		console.log("Error:", err);
    }

    res.send('Done with post');	
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

					parseContent( data[i].path, ghrepo );

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo );

				}

			}
		}
	});
}

function parseContent ( path, ghrepo ) {

	var rawHeader = { Accept: 'application/vnd.github.beta.raw+json' };
	var rawPath = "https://api.github.com/repos/joebadmo/afdocs-test/contents/" + path;
	var options = {
		uri: rawPath,
		headers: rawHeader
	};

	request( options, function (error, rawContent, body) {

		var tempObj = yamlFront( rawContent.body );
		var parsedObj = {
			title: tempObj.attributes.title,
			path: path.replace(".markdown","").replace("index",""),
			content: converter.makeHtml( tempObj.body )
		};

		indexDoc ( parsedObj );

	});	
}

function yamlFront ( input ) {
	//regex to find yaml front matter
	var regex = /^\s*---[\s\S]+?---\s*/gi;
	var match = regex.exec( input );
	var yamlString = "";
	if ( match !== null ) {
		yamlString = match[0];
	} else {
		yamlString = '';
	}
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
	console.log( "Indexed " + fileObj.path );
}

function deindexDoc ( path ) {

	var options = {
		uri: searchifyURL,
		method: 'DELETE',
		qs: { q: path }
	};

	var delPath = '/v1/indexes/idx/docs/?q=' + path;

	client.del( delPath, function(err, req, res) {
		console.log( err );
		console.log( req );
		console.log( res );
	});
/*
	request( options, function (error, response, body) {
		console.log( error );
		console.log( response );
	});	*/
}

app.listen(process.env.VCAP_APP_PORT || 3000);
