module.exports = function( octonode ) {

    return function ( conf ) {
        var credentials = conf.github.credentials || {}
          , username = credentials.username || conf.github.user
          , password = credentials.password
          ;

        return password ? octonode.client({ username: username, password: password }) : octonode.client();
    };

};
