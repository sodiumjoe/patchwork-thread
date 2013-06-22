module.exports = function( opts ) {

    opts = opts || {};

    var fs = require( 'fs' )
      , yaml = require( 'js-yaml' )
      , _ = require( 'underscore' )
      , parse = require( '../parse' )
      , octonode = require( 'octonode' )
      , github = require( '../github' )
      , githubConf = require( './github' )
      , buildGithubClient = githubConf( octonode )
      , receiveLib = require( './receivers' )
      , receiverFiles = fs.readdirSync( './lib/receivers' )
      , receivers = {}
      , confArray, buildReceiverFn
      ;

    receiverFiles.forEach( function( file ) {
        receivers[ file ] = require( '../../lib/receivers/' + file );
    });

    buildReceiverFn = receiveLib( receivers );

    try {
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
                conf.github.client = github( client );
                conf.parse = parse;

                // add receive method to conf
                conf.receive = buildReceiverFn( conf, receivers );

                return conf;
            });

        })();

    } catch ( error ) {
        throw new Error( "Error loading config file: " + error );
    }

    function get( user, repo ) {
        var match = _.find( confArray, function( conf ) {
            return conf.github.user === user && conf.github.repo === repo;
        });

        if ( match ) {
            return match;
        }

        throw( new Error( 'No configuration for user "' + user + '" and repo "' + repo + '".' ) );
    };

    return { get: get };

};
