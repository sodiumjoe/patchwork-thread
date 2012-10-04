var request = require('request');
var Converter = require("./lib/pagedown/Markdown.Converter").Converter;
var converter = new Converter();
var restify = require('restify');
var searchifyClient = restify.createJsonClient({
	url: searchifyURL
});
var async = require('async');
var express = require('express');
var app = express.createServer();
app.use(express.logger());
var searchifyURL = process.env.SEARCHIFY_PRIVATE_API_URL;
var searchifyIndexName = 'afdocs';
var yamlFront = require('./lib/yamlFront');
var repoName = 'joebadmo/afdocs-test';
var github = require('octonode');
var client = github.client();
var ghrepo = client.repo(repoName);
var mongoose = require('mongoose'),
	docsColl = mongoose.createConnection('localhost', 'test');

var fileCount = 0;

docsColl.on('error', console.error.bind(console, 'connection error:'));
docsColl.once( 'open', function () {
	console.log ( 'connected to mongodb');
});

var docSchema = new mongoose.Schema ({
	title: String,
	body: String,
	category: String,
	path: String,
	tags: []
});

var menuSchema  = new mongoose.Schema ({
	menuArray: String
});

var Doc = docsColl.model('document', docSchema );
var Menu = docsColl.model('menu', menuSchema );

var recursionCount = 0;

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.post('/pusher', function(req, res) {
    console.log( 'post received' );
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
			parseContent( updates[i], ghrepo, indexDoc );
		}

		console.log ( "Removing: \n " + removed.toString() );
		for ( i = 0; i < removed.length; i++ ) {
			deindexDoc( removed[i] );
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

	var menuArr = [];
	//buildMenu( rootPath, ghrepo, menuArr );

	res.send( "index request received for " + repoName );
});

var menuArr = [];

app.get('/menu', function(req, res){
    console.log('menu index request received');
	var rootPath = '/';

	menuArr = [];
	recursionCount = 1;
	buildMenu( rootPath, ghrepo, menuArr, function () {
		sortMenu ( menuArr, function ( sortedMenu ) {
			saveMenu ( sortedMenu );
		});
	});
	res.send( "index request received for " + repoName );
});

app.get('/getmenu', function ( req, res ) {
	res.send ( menuArr );
	Menu.findOne ( function ( err, menu ) {
		//console.log ( menu );
	});
});

function parsePath( path, ghrepo ) {
	ghrepo.contents(path, function (err, data) {

		for ( i = 0; i < data.length; i++ ) {

			// ignore dotfiles and contents
			if ( data[i].path.substring( 0, 1 ) !== '.' && data[i].name !=='contents') {

				if ( data[i].type === 'file' ) {

					if ( data[i].path.substring( 0, 1 ) === '/' ) {
						data[i].path = data[i].path.substring( 1 );
					}
					//console.log ( 'parsing ' + data[i].path );
					parseContent( data[i].path, ghrepo, indexDoc );

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo );

				}
			}
		}
	});
}

function parseContent ( path, ghrepo, callback ) {

	var rawHeader = { Accept: 'application/vnd.github.beta.raw+json' };
	var rawPath = "https://api.github.com/repos/" + repoName + "/contents/" + path;
	var options = {
		uri: rawPath,
		headers: rawHeader
	};

	request( options, function ( error, rawContent, body ) {

		if ( error ) {
			console.log ( error + path );
		}

		var tempObj = yamlFront.parse( rawContent.body );
		var parsedObj = {
			title: tempObj.attributes.title,
			path: path.replace(".markdown","").replace("index",""),
			content: tempObj.body,
			docid: path.replace(".markdown","").replace(/\//g,'-'),
			weight: tempObj.attributes.weight || 0
		};

		if ( parsedObj.path.substring ( parsedObj.path.length - 8, parsedObj.path.length ) === 'overview' ) {
			parsedObj.weight = 0;
		}

		callback ( parsedObj );

	});	
}

function indexDoc ( fileObj ) {

	// Index to Searchify
	/*searchifyClient.put('/v1/indexes/' + searchifyIndexName + '/docs', { docid: fileObj.docid, fields: { text: fileObj.content, title: fileObj.title, path: fileObj.path } }, function( err, req, res, obj ) {
		console.log ( 'index error: ' + err );
		console.log( "Indexed " + fileObj.path );
	});*/

	var pathArr = fileObj.path.split('/');
	var cat = '';
	for ( i = 0; i < pathArr.length - 1; i++ ) {
		cat += pathArr[i];
		if ( i < pathArr.length - 2 ) {
			cat += '.';
		}
	}

	// Index to MongoDB
	Doc.findOne ( { 'path': fileObj.path } , function ( err, doc ) {

		if ( doc ) {
			doc.title = fileObj.title;
			doc.body = fileObj.content;
			doc.path = fileObj.path;
			doc.category = cat;
			doc.save( function ( err ) {
				if ( err ) return handleError ( err );
				console.log ( fileObj.path + ' doc updated to mongodb' + 'category: ' + cat );
			});
		} else {

			var newDoc = new Doc ({ 
				title: fileObj.title,
				body: fileObj.content,
				path: fileObj.path,
				category: cat
			});

			newDoc.save( function ( err ) {
				if ( err ) return handleError ( err );
				console.log ( fileObj.path + ' new doc saved to mongodb' + 'category: ' + cat );
			});
		}
	});

}

function deindexDoc ( path ) {

	var options = {
		uri: searchifyURL,
		method: 'DELETE',
		qs: 'docid=' + path.replace('.markdown','').replace('/', '-')
	};

	var delPath = '/v1/indexes/' + searchifyIndexName + '/docs/?' + 'docid=' + path;

	searchifyClient.del( delPath, function(err, req, res) {
		console.log( err );
		console.log( req );
	});

	Doc.find ( { 'path': path.replace('.markdown','') } ).remove();
}

function buildMenu ( path, ghrepo, menuArray, callback ) {
	ghrepo.contents( path, function ( err, data ) {
		async.forEach( data, parseMenuArray, callback );
	});

	function parseMenuArray ( item, forCallback ) {

		// ignore dotfiles and contents
		if ( item.path.substring( 0, 1 ) !== '.' && item.name !=='contents') {

			if ( item.type === 'file' ) {

				if ( item.path.substring( 0, 1 ) === '/' ) {
					item.path = item.path.substring( 1 );
				}

				parseContent( item.path, ghrepo, function ( parsedObj ) {

					var newMenuObj = { 'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight };

					menuArray.push ( newMenuObj );
					console.log ( newMenuObj.path );
					forCallback ( null );
				});

			} else if ( item.type === 'dir' ) {

				parseContent( item.path + '/overview.markdown', ghrepo, function ( parsedObj ) {

					var newMenuObj = { 'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight, 'children': [] };
					menuArray.push ( newMenuObj );
					console.log ( newMenuObj.path );

					buildMenu( parsedObj.path.replace('/overview',''), ghrepo, newMenuObj.children, forCallback );
				});
			}
		} else {
			forCallback ( null );
		}
	}
}

function sortMenu ( menuArr2, callback ) {
	async.sortBy ( menuArr2, function ( item, sortCallback ) {
		if ( item.children ) {
			if ( item.children.length > 0 ) {
				sortMenu ( item.children, function () { 
					sortCallback ( null, item.weight );
				});
			} else {
				sortCallback ( null, item.weight );
			}
		} else {
			sortCallback ( null, item.weight );
		}
	}, function ( err, results ) {
		console.log ( results );
		callback ( results );
	});
}

function saveMenu ( menuArr2 ) {
	var newMenu = new Menu ({ 
		menuArray: menuArr2
	});
	newMenu.save( function ( err ) {
		if ( err ) return handleError ( err );
		//console.log ( ' new menu saved to mongodb' + menuArr );
		console.log ( menuArr2 );
		menuArr = menuArr2
	});
}

app.listen(process.env.VCAP_APP_PORT || 3000);
