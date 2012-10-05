var request = require('request'),
    Converter = require("./lib/pagedown/Markdown.Converter").Converter,
    converter = new Converter(),
    restify = require('restify'),
    searchifyClient = restify.createJsonClient({
		url: searchifyURL
	}),
    async = require('async'),
    express = require('express'),
    app = express.createServer(),
    searchifyURL = process.env.SEARCHIFY_PRIVATE_API_URL,
    searchifyIndexName = 'afdocs',
    yamlFront = require('./lib/yamlFront'),
    repoName = 'joebadmo/afdocs-test',
    github = require('octonode'),
    client = github.client(),
    ghrepo = client.repo(repoName),
    mongoose = require('mongoose'),
	docsColl = mongoose.createConnection('localhost', 'test'),
	rootPath = '/';

app.use(express.logger());

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

var menuSchema = new mongoose.Schema ({
	menuArray: {},
	title: String
});

var Doc = docsColl.model( 'document', docSchema );
var Menu = docsColl.model( 'menu', menuSchema );

app.configure ( function ( ) {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.post( '/pusher', function( req, res ) {
    console.log( 'post received' );
    try {
		p = req.body.payload;
		console.log(p);

		var obj = JSON.parse(p);

		var lastCommit = obj.commits[ obj.commits.length - 1 ];
		
		console.log ( "Last commit: \n" + lastCommit.id );

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
	parsePath( rootPath, ghrepo );
	buildMenu( rootPath, ghrepo, [], function () {
		sortMenu ( menuArr, function ( sortedMenu ) {
			saveMenu ( sortedMenu, function () {
				console.log ( 'done' );
			});
		});
	});

	res.send( "index request received for " + repoName );
});

app.get('/menu', function(req, res){
	var menuArr = [];
    console.log('menu index request received');
	res.send( "index request received for " + repoName );
	buildMenu( rootPath, ghrepo, menuArr, function () {
		sortMenu ( menuArr, function ( sortedMenu ) {
			saveMenu ( sortedMenu, function () {
				console.log ( 'menu saved' );
			});
		});
	});
});

app.get('/getmenu', function ( req, res ) {
	Menu.find( { 'title': 'menu' }, function ( err, menu ) {
		console.log ( menu );
		if ( err ) {
			console.log ( err );
		}
		res.send ( JSON.stringify ( menu ) );
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

					parseContent( data[i].path, ghrepo, indexDoc );

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo );

				}
			}
		}
	});
}

function parseContent ( path, ghrepo, callback ) {

	var rawHeader = { Accept: 'application/vnd.github.beta.raw+json' },
	    rawPath = "https://api.github.com/repos/" + repoName + "/contents/" + path,
	    options = {
		uri: rawPath,
		headers: rawHeader
	};

	request( options, function ( error, rawContent, body ) {

		if ( error ) {
			console.log ( error + path );
		}

		var tempObj = yamlFront.parse( rawContent.body ),
		    parsedObj = {
			title: tempObj.attributes.title,
			path: path.replace(".markdown","").replace("index",""),
			content: tempObj.body,
			docid: path.replace(".markdown","").replace(/\//g,'-'),
			weight: tempObj.attributes.weight || 0
		};

		callback ( parsedObj );

	});	
}

function indexDoc ( fileObj ) {

	// Index to Searchify
	searchifyClient.put('/v1/indexes/' + searchifyIndexName + '/docs', { docid: fileObj.docid, fields: { text: fileObj.content, title: fileObj.title, path: fileObj.path } }, function( err, req, res, obj ) {
		console.log ( 'index error: ' + err );
		console.log( "Indexed " + fileObj.path );
	});

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
		if ( item.path.substring( 0, 1 ) !== '.' ) {

			if ( item.type === 'file' ) {

				if ( item.path.substring( 0, 1 ) === '/' ) {
					item.path = item.path.substring( 1 );
				}

				parseContent( item.path, ghrepo, function ( parsedObj ) {

					var newMenuObj = { 'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight };
					if ( newMenuObj.path.substring ( newMenuObj.path.length - 8, newMenuObj.path.length ) === 'overview' ) {
						newMenuObj.weight = 0;
					}
					menuArray.push ( newMenuObj );
					forCallback ( null );
				});

			} else if ( item.type === 'dir' ) {

				parseContent( item.path + '/overview.markdown', ghrepo, function ( parsedObj ) {

					var newMenuObj = { 'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight, 'children': [] };
					menuArray.push ( newMenuObj );
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
				sortMenu ( item.children, function ( results ) { 
					item.children = results;
					sortCallback ( null, item.weight );
				});
			} else {
				sortCallback ( null, item.weight );
			}
		} else {
			sortCallback ( null, item.weight );
		}
	}, function ( err, results ) {
		menuArr2 = results;
		callback ( menuArr2 );
	});
}

function saveMenu ( menuArr, callback ) {

	Menu.findOne( { 'title': 'menu' }, function ( err, menu ) {

		if ( menu ) {
			console.log ( 'updating menu');
			menu.menuArray = menuArr ;
		} else {
			console.log ( 'saving new menu' );
			var menu = new Menu ({ 
				title: "menu",
				menuArray: menuArr
			});
		}

		menu.save( function ( err ) {
			if ( err ) return handleError ( err );
			console.log ( ' new menu saved to mongodb' );
			callback ();
		});

	});
}

app.listen(process.env.VCAP_APP_PORT || 3000);
