module.exports = function( opts ) {

    var fs = require( 'fs' )
      , yaml = require( 'js-yaml' )
      , _ = require( 'underscore' )
      , github = opts.github || require( 'octonode' )
      , get, confArray, getGithubClient
      ;

    get = function( user, repo ) {
        return _.find( confArray, function( conf ) {
            return conf.github.user === user && conf.github.repo === repo;
        });
    };

    getGithubClient = function( conf ){
        var credentials = conf.github.credentials || {}
          , username = credentials.username || conf.github.user
          , password = credentials.password 
          ;

        return password ? github.client({ username: username, password: password }) : github.client();
    };

    confArray = (function(){
        var configYamlString, initialConfs;

        // dependency injection
        if ( opts.config ) { return [ opts.config ]; }

        // load and parse config file
        configYamlString = opts.configFile ? fs.readFileSync( opts.configFile, 'utf8' ) : fs.readFileSync( './config.yml', 'utf8' );
        return yaml.load( configYamlString ).map( function( conf ) {
            // add ghrepo method to conf
            conf.github.ghrepo = getGithubClient( conf ).repo( conf.github.user + '/' + conf.github.repo );
            return conf;
        });

    })();

    return { get: get
           , getGithubClient: getGithubClient
           };
};
