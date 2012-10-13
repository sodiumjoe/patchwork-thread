var fs = require('fs'),
    request = require('request'),
    Converter = require('./lib/pagedown/Markdown.Converter').Converter,
    converter = new Converter(),
    restify = require('restify'),
    async = require('async'),
    express = require('express'),
    app = express.createServer(),
    yamlFront = require('./lib/yamlFront'),
    mongoose = require('mongoose'),
    confData = fs.readFileSync('./config.json');

try{
	var conf = JSON.parse(confData).config;
	async.forEach(conf, function(item, callback){
		item.github.repoName = item.github.user + '/' + item.github.repo;
		if(item.searchify.url === null){
			item.searchify.url = process.env[item.searchify.privateEnvVar]|| null;
		}
	},
	function(err){
		if(err){
			console.log(err);
		}
	});
}catch(err){
	console.log('Error in config.json file:');
	console.log(err);
}

/*
var searchify = conf[0].searchify,
	githubconf = conf[0].github,
    //repoName = githubconf.user + '/' + githubconf.repo,
	rootPath = conf[0].rootPath;*/

var github = require('octonode'),
    client = github.client(),
	docsColl = mongoose.createConnection('localhost', conf[0].db);

app.use(express.logger());

docsColl.on('error', console.error.bind(console, 'connection error:'));
docsColl.once('open', function(){
	console.log('connected to mongodb');
});

var docSchema = new mongoose.Schema({
	title: String,
	body: String,
	category: String,
	path: String,
	tags:[]
});

var menuSchema = new mongoose.Schema({
	menuArray:{},
	title: String
});

var Doc = docsColl.model('document', docSchema);
var Menu = docsColl.model('menu', menuSchema);

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.post('/pusher', function(req, res){
    console.log('post received');
	var currentConf ={};
    try{
		p = req.body.payload;
		console.log(p);

		var obj = JSON.parse(p);

		async.forEach(conf, function(item, callback){
			if(item.github.user === obj.repository.owner.name && item.github.repo === obj.repository.name){
				currentConf = item;
				callback(null);
			}else{
				callback(null);
			}
		},
		function(err){
			if(err){
				console.log(err);
			}else if(currentConf === {}){
				concole.log('No configuration for pushed repository: ' + obj.repository.owner.name + '/' + obj.repository.name);
			}else{
				var lastCommit = obj.commits[obj.commits.length - 1],
				    updates = lastCommit.added.concat(lastCommit.modified),
				    removed = lastCommit.removed;
				console.log("Last commit: \n" + lastCommit.id);
				console.log("Updating: \n " + updates.toString());
				async.forEach(updates, function(item, callback){
					parseContent(item, client.repo(currentConf.github.repoName), currentConf.github.repoName, function(err, parsedObj){
						if(err){
							callback(err);
						}else{
							indexDoc(parsedObj, currentConf, callback);
						}
					});
				}, 
				function(err){
					if(err){
						console.log(err);
					}else{
						console.log("Updates complete");
					}
				});

				console.log("Removing: \n " + removed.toString());
				async.forEach(removed, function(item, callback){
					deindexDoc(item, currentConf, callback);
				}, 
				function(err){
					if(err){
						console.log(err);
					}else{
						console.log('Removals complete');
					}
				});

				indexMenu();
			}
		});

	}catch(err){
		console.log("Error:", err);
	}

	res.send('Done with post');	
});

app.get('/index/:conf', function(req, res){
	if(!req.params.conf || parseInt(req.params.conf) >= conf.length){
		res.send('missing or invalid conf param ' + typeof(req.params.conf));
	}else{
		var currentConf = conf[req.params.conf];
		console.log('index request received');
		res.send('index request received for ' + currentConf.github.repoName);
		parsePath(currentConf.rootPath, client.repo(currentConf.github.repoName), currentConf, function(err){
			if(err){
				console.log(err);
			} else {
				console.log('done');
			}
		});

		indexMenu(currentConf, function(err){
			if(err){
				console.log(err);
			}else{
				res.send('menu index complete');
			}
		});
	}
});

app.get('/menu', function(req, res){
	indexMenu(function(err){
		if(err){
			console.log(err);
		}else{
			res.send('menu index complete');
		}
	});
});

app.get('/getmenu', function(req, res){
	Menu.find({'title': 'menu'}, function(err, menu){
		if(err){
			console.log(err);
		}else{
			res.send(menu[0].menuArray);
		}
	});
});

function parsePath(path, ghrepo, currentConf, callback){
	ghrepo.contents(path, function(err, data){
		if(err){
			callback(err);
		}else{
			async.forEach(data, 
				function(item, forCallback){
					if(item.path.substring(0, 1)!== '.'){
						if(item.type === 'file' && (item.path.substring(item.path.length - 9) === '.markdown' || item.path.substring(item.path.length - 3) === '.md')){
							if(item.path.substring(0, 1) === '/'){
								item.path = item.path.substring(1);
							}
							parseContent(item.path, ghrepo, currentConf.github.repoName, function(err, parsedObj){
								if(err){
									forCallback(err);
								}else{
									indexDoc(parsedObj, currentConf, forCallback);
								}
							});
						}else if(item.type === 'dir'){
							parsePath(item.path, ghrepo, currentConf, forCallback);
						}else{
							console.log('skipped non-markdown file: ' + item.path);
							forCallback(null);
						}
					}else{
						console.log('skipped dotfile: ' + item.path);
						forCallback(null);
					}
				}, 
				function(err){
					if(err){
						if(callback){
							callback(err);
						}else{
							console.log(err);
						}
					}else{
						callback(null);
					}
			});
		}
	});
}

function parseContent(path, ghrepo, repoName, callback){
	ghrepo.contents(path, function(err, data){
		if(err){
			callback(err);
		}else{
			if(data.type === 'file'){
				var rawHeader = {Accept: 'application/vnd.github.beta.raw+json'},
					rawPath = 'https://api.github.com/repos/' + repoName + '/contents/' + path,
					options = {
						uri: rawPath,
						headers: rawHeader
					};
				request(options, function(err2, rawContent, body){
					if(err2){
						callback(err2);
					}else{
						yamlFront.parse(rawContent.body, function(err3, tempObj){
							if(err3){
								callback(err3 + path);
							}else{
								var pathArr = path.split('/');
								pathArr.pop();
								var cat = '';
								async.forEachSeries(pathArr, function(item, forCallback){
									cat += (item + '.');
									forCallback(null);
								},function(err){
									if(err){
										callback(err);
									}else{
										var parsedObj ={
											title: tempObj.attributes.title,
											path: path.replace(".markdown","").replace("index",""),
											content: tempObj.body,
											docid: path.replace(".markdown","").replace(/\//g,'-'),
											weight: tempObj.attributes.weight || 0,
									        category: cat.substring(0, cat.length-1)
										};

										if(parsedObj.category === ''){
											parsedObj.category='root';
										}
									
										if(tempObj.attributes.redirect){
											parsedObj.redirect = tempObj.attributes.redirect;
										}
										callback(null, parsedObj);
									}
								});
							}
						});
					}
				});	
			}else{
				callback('Not a file: ' + path);
			}
		}
	});
}

function indexDoc(fileObj, currentConf, callback){
	
	// Ignore redirect files for searchify
	if(fileObj.redirect){
		console.log('skipped indexing redirect to searchify: ' + fileObj.path);
		callback(null);
	}else{
		if(currentConf.searchify.url !== null){
			// Index to Searchify
			var searchifyClient = restify.createJsonClient({
					url: currentConf.searchify.url
				});
			searchifyClient.put('/v1/indexes/' + currentConf.searchify.index + '/docs', {docid: fileObj.docid, fields: {text: fileObj.content, title: fileObj.title, path: fileObj.path}}, function(err, req, res, obj){
				if(err){
					callback(err);
				}else{
					console.log("Indexed to searchify: " + fileObj.path);
					// Index to MongoDB
					Doc.findOne({'path': fileObj.path}, function(err, doc){
						if(err){
							callback(err);
						}else{
							if(doc){
								doc.title = fileObj.title;
								doc.body = fileObj.content;
								doc.path = fileObj.path;
								doc.category = fileObj.category;
								doc.save(function(err){
									if(err){
										callback(err);
									}else{
										callback(null);
									}
								});
							}else{
								var newDoc = new Doc({
									title: fileObj.title,
									body: fileObj.content,
									path: fileObj.path,
									category: fileObj.category
								});

								newDoc.save(function(err){
									if(err){
										callback(err);
									}else{
										callback(null);
									}
								});
							}
						}
					});
				}
			});
		}else{
			callback('searchify API URL not set, unable to index: ' + fileObj.path);
		}
	}
}

function deindexDoc(path, currentConf, callback){

	if(currentConf.searchify.url !== null){
		var searchifyClient = restify.createJsonClient({
				url: currentConf.searchify.url
			}),
			delPath = '/v1/indexes/' + currentConf.searchify.index + '/docs/?' + 'docid=' + path;

		searchifyClient.del(delPath, function(err, req, res){
			if(err){
				callback(err);
			}else{
				console.log('deindexed from searchify: ' + fileObj.path);
				Doc.find({'path': path.replace('.markdown','')}).remove(function(err){
					if(err){
						callback(err);
					}else{
						console.log(path + ' removed from DB');
						callback(null);
					}
				});
			}
		});
	}else{
		console.log('searchify API URL not set, unable to index: ' + fileObj.path);
		Doc.find({'path': path.replace('.markdown','')}).remove(function(err){
			if(err){
				callback(err);
			}else{
				console.log(path + ' removed from DB');
				callback(null);
			}
		});
	}
}

function indexMenu(currentConf, callback){
	var menuArr =[];
    console.log('menu index request received');
	buildMenu(rootPath, client.repo("joebadmo/afdocs-test"), menuArr, function(err){
		if(err){
			if(callback){
				callback(err);
			}else{
				console.log(err);
			}
		}else{
			sortMenu(menuArr, function(sortedMenu){
				saveMenu(sortedMenu, function(){
					console.log('menu saved');
					if(callback){
						callback(null);
					}
				});
			});
		}
	});
}

function buildMenu(path, ghrepo, menuArray, callback){
	ghrepo.contents(path, function(err, data){
		if(err){
			callback(err);
		}else{
			async.forEach(data, parseMenuArray, function(err){
				if(err){
					callback(err);
				}else{
					callback(null);
				}
			});
		}
	});

	function parseMenuArray(item, forCallback){

		if(item.path.substring(0, 1)!== '.'){
			if(item.type === 'file'){
				if(item.path.substring(0, 1)=== '/'){
					item.path = item.path.substring(1);
				}
				parseContent(item.path, ghrepo, function(err, parsedObj){
					if(err){
						forCallback(err);
					}else{
						//handle redirect files
						if(parsedObj.redirect){
							var newMenuObj ={'title': parsedObj.title, 'path': parsedObj.redirect, 'weight': parsedObj.weight};

						}else{

							var newMenuObj ={'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight};
							if(newMenuObj.path.substring(newMenuObj.path.length - 8, newMenuObj.path.length)=== 'overview'){
								newMenuObj.weight = 0;
							}
						}
						menuArray.push(newMenuObj);
						forCallback(null);
					}
				});

			}else if(item.type === 'dir'){

				parseContent(item.path + '/overview.markdown', ghrepo, function(err, parsedObj){

					if(err){
						forCallback(err);
					}else{

						var newMenuObj ={'title': parsedObj.title, 'path': parsedObj.path.replace('/overview',''), 'weight': parsedObj.weight, 'children':[]};
						menuArray.push(newMenuObj);
						buildMenu(parsedObj.path.replace('/overview',''), ghrepo, newMenuObj.children, forCallback);
					}
				});
			}else{
				forCallback('Error: unknown file type for "' + item.path + '"');
			}
		}else{
			console.log('parse menu skipping dotfile: ' + item.path);
			forCallback(null);
		}
	}
}

function sortMenu(menuArr2, callback){
	async.sortBy(menuArr2, function(item, sortCallback){
		if(item.children){
			if(item.children.length > 0){
				sortMenu(item.children, function(results){
					item.children = results;
					sortCallback(null, item.weight);
				});
			}else{
				sortCallback(null, item.weight);
			}
		}else{
			sortCallback(null, item.weight);
		}
	}, function(err, results){
		if(err){
			callback(err);
		}else{
			menuArr2 = results;
			callback(menuArr2);
		}
	});
}

function saveMenu(menuArr, callback){

	Menu.findOne({'title': 'menu'}, function(err, menu){

		if(err){
			callback(err);

		}else if(menu){
			console.log('updating menu');
			menu.menuArray = menuArr ;
		}else{
			console.log('saving new menu');
			var menu = new Menu({
				title: "menu",
				menuArray: menuArr
			});
		}

		menu.save(function(err){
			if(err){
				callback(err);
			}else{
				console.log(' new menu saved to mongodb');
				callback(null);
			}
		});

	});
}

app.listen(process.env.VCAP_APP_PORT || 3000);
