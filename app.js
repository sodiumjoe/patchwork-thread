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
	mongoConnectionURI = 'localhost',
    confData = fs.readFileSync('./config.json');

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongoConnectionURI = 'mongodb://' + env['mongodb-1.8'][0]['credentials']['username'] + ':' + env['mongodb-1.8'][0]['credentials']['password'] + '@' + env['mongodb-1.8'][0]['credentials']['host'] + ':' + env['mongodb-1.8'][0]['credentials']['port'] + '/' + env['mongodb-1.8'][0]['credentials']['database'];
}

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

var github = require('octonode'),
    client = github.client();

var docSchema = new mongoose.Schema({
	title: String,
	body: String,
	category: String,
	path: String,
	tags:[]
});

var menuSchema = new mongoose.Schema({
	menuArray: {},
	title: String
});

app.use(express.logger());
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.use(express.logger());
});

app.post('/pusher', function(req, res){
    console.log('post received');
	var currentConf = {};
    try{
		p = req.body.payload;
		console.log(p);

		var obj = JSON.parse(p);

		async.forEach(conf, function(item, callback){
			if(item.github.user === obj.repository.owner.name && item.github.repo === obj.repository.name){
				currentConf = item;
				callback(null);
			}else{
				callback('No configuration for pushed repository: ' + obj.repository.owner.name + '/' + obj.repository.name);
			}
		},
		function(err){
			if(err){
				console.log(err);
			}else{
				var searchifyClient = restify.createJsonClient({
						url: currentConf.searchify.url
					}),
				    docsColl = mongoose.createConnection('localhost', currentConf.db);
				docsColl.on('error', console.error.bind(console, 'connection error:'));
				var Doc = docsColl.model('document', docSchema),
				    lastCommit = obj.commits[obj.commits.length - 1],
				    updates = lastCommit.added.concat(lastCommit.modified),
				    removed = lastCommit.removed;
				console.log("Last commit: \n" + lastCommit.id);
				console.log("Updating: \n " + updates.toString());
				async.forEach(updates, function(item, callback){
					parseContent(item, client.repo(currentConf.github.repoName), currentConf.github.repoName, function(err, parsedObj){
						if(err){
							callback(err);
						}else{
							if(currentConf.searchify.url !== null){
								indexToSearch(parsedObj, currentConf.searchify.index, searchifyClient, function(err){
									addToDB(parsedObj, Doc, callback);
								});
							}else{
								addToDB(parsedObj, Doc, callback);
							}
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
					if(currentConf.searchify.url !== null){
						deindexFromSearch(item, currentConf.searchify.index, searchifyClient, function(err){
							if(err){
								callback(err);
							}else{
								removeFromDB(item, Doc, callback);
							}
						});
					}else{
						removeFromDB(item, Doc, callback);
					}
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
				console.log('content index complete');
			}
		});

		indexMenu(currentConf, function(err){
			if(err){
				console.log(err);
			}else{
				console.log('menu index complete');
			}
		});
	}
});

function parsePath(path, ghrepo, currentConf, callback){
	var searchifyClient = restify.createJsonClient({
			url: currentConf.searchify.url
		});
	var docsColl = mongoose.createConnection('localhost', currentConf.db);
	docsColl.on('error', console.error.bind(console, 'connection error:'));
	var Doc = docsColl.model('document', docSchema);
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
									if(currentConf.searchify.url !== null){
										indexToSearch(parsedObj, currentConf.searchify.index, searchifyClient, function(err){
											addToDB(parsedObj, Doc, forCallback);
										});
									}else{
										addToDB(parsedObj, Doc, forCallback);
									}

								}
							});
						}else if(item.type === 'dir'){
							if(item.path === currentConf.imagePath){
								console.log('skipped images dir: ' + item.path);
								forCallback(null);
							}else{
								parsePath(item.path, ghrepo, currentConf, forCallback);
							}
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
						yamlFront.parse(rawContent.body, function(err3, parsedObj){
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
										parsedObj.docid = path.replace(".markdown","").replace(/\//g,'-');
									    parsedObj.path = path.replace(".markdown","").replace("index","");
										parsedObj.category = cat.substring(0, cat.length-1);
										if(!parsedObj.weight){
											parsedObj.weight = 0;
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

function indexToSearch(fileObj, searchifyIndex, searchifyClient, callback){
	searchifyClient.put('/v1/indexes/' + searchifyIndex + '/docs', {docid: fileObj.docid, fields: {text: fileObj.content, title: fileObj.title, path: fileObj.path}}, function(err, req, res, obj){
		if(err){
			callback(err);
		}else{
			console.log("Indexed to searchify: " + fileObj.path);
			callback(null);
		}
	});
}

function deindexFromSearch(path, searchifyIndex, searchifyClient, callback){
	var delPath = '/v1/indexes/' + searchifyIndex + '/docs/?' + 'docid=' + path;
	searchifyClient.del(delPath, function(err, req, res){
		if(err){
			callback(err);
		}else{
			console.log('deindexed from searchify: ' + path);
			callback(null);
		}
	});
}

function addToDB(fileObj, mongoDoc, callback){
	mongoDoc.findOne({'path': fileObj.path}, function(err, doc){
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
						console.log(fileObj.path + ' added to mongodb');
						callback(null);
					}
				});
			}else{
				var newDoc = new mongoDoc({
					title: fileObj.title,
					body: fileObj.content,
					path: fileObj.path,
					category: fileObj.category
				});

				newDoc.save(function(err){
					if(err){
						callback(err);
					}else{
						console.log(fileObj.title + ' updated mongodb');
						callback(null);
					}
				});
			}
		}
	});
}

function removeFromDB(path, mongoDoc, callback){
	mongoDoc.find({'path': path.replace('.markdown','')}).remove(function(err){
		if(err){
			callback(err);
		}else{
			console.log(path + ' removed from DB');
			callback(null);
		}
	});
}

function indexMenu(currentConf, callback){
	var menuArr =[];
	var docsColl = mongoose.createConnection('localhost', currentConf.db);
	docsColl.on('error', console.error.bind(console, 'connection error:'));
	var Menu = docsColl.model('menu', menuSchema);
    console.log('menu index request received');
	buildMenu(currentConf.rootPath, currentConf, client.repo(currentConf.github.repoName), menuArr, function(err){
		if(err){
			if(callback){
				callback('error building menu: ' + err);
			}else{
				console.log(err);
			}
		}else{
			sortMenu(menuArr, function(err, sortedMenu){
				if(err){
					if(callback){
						callback('error sorting menu: ' + err);
					}else{
						console.log('error sorting menu: ' + err);
					}
				}else{
					saveMenu(sortedMenu, currentConf, Menu, function(err){
						if(err){
							if(callback){
								callback('error saving menu: ' + err);
							}else{
								console.log('error saving menu: ' + err);
							}
						}else{
							if(callback){
								callback(null);
							}
						}
					});
				}
			});
		}
	});
}

function buildMenu(path, currentConf, ghrepo, menuArray, callback){
	ghrepo.contents(path, function(err, data){
		if(err){
			callback('ghrepo error: ' + err);
		}else{
			async.forEach(data, parseMenuArray, callback);
		}
	});

	function parseMenuArray(item, forCallback){
		if(item.path.substring(0, 1) !== '.'){
			if(item.type === 'file' && (item.path.substring(item.path.length - 9) === '.markdown' || item.path.substring(item.path.length - 3) === '.md')){
				if(item.path.substring(0, 1) === '/'){
					item.path = item.path.substring(1);
				}
				parseContent(item.path, ghrepo, currentConf.github.repoName, function(err, parsedObj){
					if(err){
						forCallback('parseContent error for path ' + item.path + ': ' + err);
					}else{
						if(parsedObj.redirect){
							var newMenuObj = {'title': parsedObj.title, 'path': parsedObj.redirect, 'weight': parsedObj.weight};
						}else{
							var newMenuObj = {'title': parsedObj.title, 'path': parsedObj.path, 'weight': parsedObj.weight};
							if(newMenuObj.path.substring(newMenuObj.path.length - 8, newMenuObj.path.length) === 'overview'){
								newMenuObj.weight = 0;
							}
						}
						menuArray.push(newMenuObj);
						forCallback(null);
					}
				});
			}else if(item.type === 'dir'){
				if(item.path !== currentConf.imagePath){
					parseContent(item.path + '/overview.markdown', ghrepo, currentConf.github.repoName, function(err, parsedObj){
						if(err){
							forCallback('error menu parsing dir: ' + item.path + err);
						}else{
							var newMenuObj = {'title': parsedObj.title, 'path': parsedObj.path.replace('/overview',''), 'weight': parsedObj.weight, 'children':[]};
							menuArray.push(newMenuObj);
							buildMenu(item.path, currentConf, ghrepo, newMenuObj.children, forCallback);
						}
					});
				}else{
					console.log('parsing menu skipped image path: ' + item.path);
					forCallback(null);
				}
			}else{
				console.log('parsing menu skipped non-markdown file: ' + item.path );
				forCallback(null);
			}
		}else{
			console.log('parsing menu skipped dotfile: ' + item.path);
			forCallback(null);
		}
	}
}

function sortMenu(menuArr2, callback){
	async.sortBy(menuArr2, function(item, sortCallback){
		if(item.children){
			if(item.children.length > 0){
				sortMenu(item.children, function(err, results){
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
			callback(null, results);
		}
	});
}

function saveMenu(menuArr, currentConf, mongoMenu, callback){
	mongoMenu.findOne({'title': 'menu'}, function(err, menu){
		if(err){
			callback(err);
		}else if(menu){
			console.log('updating menu');
			menu.menuArray = menuArr ;
		}else{
			console.log('saving new menu');
			var menu = new mongoMenu({
				title: "menu",
				menuArray: menuArr
			});
		}

		menu.save(function(err){
			if(err){
				callback(err);
			}else{
				console.log('menu saved to mongodb');
				callback(null);
			}
		});

	});
}

app.listen(process.env.VCAP_APP_PORT || 3000);
