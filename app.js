var express = require('express');
var app = express.createServer();
app.use(express.logger());
var mongo;
app.configure('development', function(){
    mongo = {
        "hostname":"localhost",
        "port":27017,
        "username":"",
        "password":"",
        "name":"",
        "db":"db"
    }
});
app.configure('production', function(){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongo = env['mongodb-1.8'][0]['credentials'];
});
var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);
var util = require('util')
var exec = require('child_process').exec;

var assert = require('assert');
var vmcjs = require('vmcjs');

var fs = require('fs');

function puts(error, stdout, stderr) { util.puts(stdout) }

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.get('/test-push', function(req, res){
	console.log('testing push');
    res.send('hi');
	var cmd = "cd fixtures; ls; chmod +x git; rm -rf afdocs-test;" + "./git clone git@github.com:joebadmo/afdocs-test.git" + "; ls; cd ..";
	
	var child = exec(cmd, function(err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
	    });


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

	

	var cmd = "cd fixtures; ls; chmod +x git; rm -rf " + obj.repository.name + "; ./git clone " + obj.repository.url +"; ls; cd ..";

	console.log(cmd);

	var child = exec(cmd, function(err, stdout, stderr) {
		//console.log(stdout);
		//console.log(stderr);
		if (err) throw err;
		else {
		    console.log('successful clone');
		} 
	    });


    } catch (err) {
	console.log("Error:", err);
    }

    res.send('Done with post');	
});


app.get('/pusher', function(req, res){
    console.log('get received');
    console.log(req);
    res.send('Done with get'); 
});

app.get('/', function(req, res) {
	res.send('Hello from Cloud Foundry');
});

app.get('/mongo', function(req, res) {
    record_visit(req, res);
});


app.listen(process.env.VCAP_APP_PORT || 3000);

var record_visit = function(req, res){
    /* Connect to the DB and auth */
    require('mongodb').connect(mongourl, function(err, conn){
        conn.collection('ips', function(err, coll){
            /* Simple object to insert: ip address and date */
            object_to_insert = { 'ip': req.connection.remoteAddress, 'ts': new Date() };
            /* Insert the object then print in response */
            /* Note the _id has been created */
            coll.insert( object_to_insert, {safe:true}, function(err){
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write(JSON.stringify(object_to_insert));
            res.end('\n');
            });
        });
    });
}
