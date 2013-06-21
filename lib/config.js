module.exports = function( opts ) {

    opts = opts || {};

    var fs = require( 'fs' )
      , yaml = require( 'js-yaml' )
      , _ = require( 'underscore' )
      , parse = require( './parse' )
      , octonode = opts.octonode || require( 'octonode' )
      , github = require( './github' )
      , get, confArray, buildGithubClient, configFile
      ;

    confArray = (function(){
        var configYamlString, client;

        // dependency injection
        if ( opts.config ) { return [ opts.config ]; }

        // load and parse config file
        configYamlString = (function(){

            if ( opts.configFile ) {
                return opts.configFile;
            }

            if ( opts.configFilePath ) {
                return fs.readFileSync( opts.configFilePath, 'utf8' );
            }

            return fs.readFileSync( './config.yml', 'utf8' );

        })();
        
        return yaml.load( configYamlString ).map( function( conf ) {
            // add repo method to conf.github
            client = buildGithubClient( conf ).repo( conf.github.user + '/' + conf.github.repo );
            conf.github.client = github(client);
            conf.parse = parse;
            return conf;
        });

    })();

    get = function( user, repo ) {
        var match = _.find( confArray, function( conf ) {
            return conf.github.user === user && conf.github.repo === repo;
        });

        if ( match ) {
            return match;
        }

        throw( new Error( 'No configuration for user "' + user + '" and repo "' + repo + '".' ) );
    };

    function buildGithubClient( conf ){
        var credentials = conf.github.credentials || {}
          , username = credentials.username || conf.github.user
          , password = credentials.password
          ;

        return password ? octonode.client({ username: username, password: password }) : octonode.client();
    };

    return { get: get
           , buildGithubClient: buildGithubClient
           };
};
