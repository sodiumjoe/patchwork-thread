var content = require('../lib/content');
//request = require('request'),
var path = '/',
    fileConf = {
        ghrepo: {
                contents: function(path, callback){
                    var data = {
                        type: 'file',

                    };
                    callback(null, data);
                }
        },
        github: {
            repo: 'fake'
        }
    };


    exports['test getContent'] = function (test) {
        global.request = function(options, callback){
            callback(null, 'raw content', 'body');
        };

        content.getContent(path, fileConf, function(err, rawContent){
            test.equal(rawContent, 'raw content');
            test.done();
        });
    };
