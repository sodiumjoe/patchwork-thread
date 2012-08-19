var github = require('octonode');
var express = require('express');
var app = express.createServer();
app.use(express.logger());
var fs = require('fs');

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

	obj = JSON.parse(p);
	obj.repository.url = obj.repository.url.replace("https", "git") + ".git"
	console.log(obj.repository.url + " " + obj.repository.name);

	console.log(obj.pusher.email + " vs. " + user);

        if (obj.pusher.email != user) {	
	    if (typeof whitelist == 'undefined') {
		// exit here
		console.log(obj.pusher.email + " doesn't match " + user + ". not authorized to push");
		res.send('Not authorized to push.');	
		return;
	    } else {
			if (whitelist.indexOf(obj.pusher.email) == -1) {
				console.log(obj.pusher.email + " not in whitelist: " + whitelist + ". not authorized to push");
				res.send('Not authorized to push.');	
				return;
			} else {
				console.log(obj.pusher.email + " in whitelist: " + whitelist + ". valid to push");
			}
	    }
	} else {
		console.log(obj.pusher.email + " matches " + user + ". valid to push");
	}

    } catch (err) {
	console.log("Error:", err);
    }

    res.send('Done with post');	
});

app.get('/index', function(req, res){
    console.log('index request received');
	var client = github.client();
	var ghrepo = client.repo('joebadmo/afdocs-test');
	var parsedContent = 0;
	var rootPath = '/';

	parsePath( rootPath, ghrepo, function( objIndex ){
		console.log( objIndex );
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
						objectIndex.push( fileObj );
					});
						console.log( objectIndex );

				} else if ( data[i].type === 'dir' ) {

					parsePath( data[i].path, ghrepo, function(dirIndex){
						objectIndex.push.apply(objectIndex, dirIndex);
					});

				}

			}
		}
		callback(objectIndex);
	});
}

function parseContent ( path, ghrepo, callback ) {

	ghrepo.contents( path, function ( err, data ){
		var tempObj = {
			path: data.path,
			//content: data.content,
			name: data.name
		};
		callback ( tempObj );
	});

}

app.listen(process.env.VCAP_APP_PORT || 3000);
