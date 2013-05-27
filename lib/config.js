module.exports = function( opts ) {

    opts = opts || {};

    var fs = require( 'fs' )
      , yaml = require( 'js-yaml' )
      , _ = require( 'underscore' )
      , octonode = opts.octonode || require( 'octonode' )
      , github = require( './github' )
      , get, confArray, getGithubClient
      ;

    get = function( user, repo ) {
        var match = _.find( confArray, function( conf ) {
            return conf.github.user === user && conf.github.repo === repo;
        });

        if ( match ) {
            return match;
        }

        throw( new Error( 'No configuration for user "' + user + '" and repo "' + repo + '".' ) );
    };

    getGithubClient = function( conf ){
        var credentials = conf.github.credentials || {}
          , username = credentials.username || conf.github.user
          , password = credentials.password
          ;

        return password ? octonode.client({ username: username, password: password }) : octonode.client();
    };

    confArray = (function(){
        var configYamlString, client;

        // dependency injection
        if ( opts.config ) { return [ opts.config ]; }

        // load and parse config file
        configYamlString = opts.configFile ? fs.readFileSync( opts.configFile, 'utf8' ) : fs.readFileSync( './config.yml', 'utf8' );
        return yaml.load( configYamlString ).map( function( conf ) {
            // add repo method to conf.github
            client = getGithubClient( conf ).repo( conf.github.user + '/' + conf.github.repo );
            conf.github.client = github(client);
            return conf;
        });

    })();

    return { get: get
           , getGithubClient: getGithubClient
           };
};
