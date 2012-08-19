var yaml = require('yamlparser');
var restify = require('restify');
var github = require('octonode');
var express = require('express');
var app = express.createServer();
app.use(express.logger());
var fs = require('fs');
var searchifyURL = "http://:h9Cg6smI4vpB51@d68nx.api.searchify.com";

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.get('/index', function(req, res){
    console.log('index request received');
	var client = github.client();
	var ghrepo = client.repo('joebadmo/afdocs-test');
	var parsedContent = 0;
	var rootPath = '/';

	parsePath( rootPath, ghrepo, function( objIndex ){
		//console.log( objIndex );
		res.send( 'done' );
	});
});

function parsePath(path, ghrepo, callback) {
	var objectIndex = [];
	ghrepo.contents(path, function (err, data) {

		for ( i = 0; i < data.length; i++ ) {

			// ignore dotfiles
			if ( data[i].path[0] !== '.' ) {

				if ( data[i].type === 'file' ) {

					parseContent( data[i].path, ghrepo, function ( fileObj ) {
						console.log( fileObj  );
					});

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo, function(dirIndex){
						//console.log( dirIndex );
					});

				}

			}
		}
		callback(objectIndex);
	});
}

function parseContent ( path, ghrepo, callback ) {

	ghrepo.contents( path, function ( err, data ){

		var tempObj = yamlFront((new Buffer(data.content, 'base64').toString('ascii'))); 
		/*var tempObj2 = {
			name: tempObj.attributes.title,
			path: data.path.replace(".markdown","").replace("index",""),
			content: tempObj.body
		};
		callback ( tempObj2 );*/
	});

}

function yamlFront ( input ) {
	//regex to find yaml front matter
	var regex = /^-{3}([\w\W]+)(-{3})([\w\W]*)*/;
	var match = regex.exec( input );
	var yamlString = match[2].replace(/^\s+|\s+$/g, '');
    var attributes = yaml.eval(yamlString);
	var body = input.replace(match[0], '');
	console.log ( "attributes: ");
 	console.log ( attributes );
	console.log ( "body: ");
	console.log (  body );
}

function indexDoc ( ) {
	var client = restify.createJsonClient({
		url: 'http://:h9Cg6smI4vpB51@d68nx.api.searchify.com'
	});

	client.put('/v1/indexes/idx/docs', {docid: "test", fields: {text: "The sum of the length of each field value MUST not be greater than 100kbytes"}}, function(err, req, res, obj) {

	  console.log(JSON.stringify(obj, null, 2));
	});

	res.send( 'done' );

}

app.listen(process.env.VCAP_APP_PORT || 3000);
