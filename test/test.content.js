var fakeRequest = function(options, callback){
    var rawContent = {
        body: 'raw content'
    };
    callback(null, rawContent, 'body');
};

var content = require('../lib/content')(fakeRequest);
var path = '/',
    fileConf = {
        github: {
            ghrepo: {
                contents: function(path, callback){
                    var data = {
                        type: 'file'
                    };
                    callback(null, data);
                }
            }
        }
    };

exports['test getContent'] = function (test) {
    content.getContent(path, fileConf, function(err, rawContent){
        test.equal(rawContent, 'raw content');
        test.done();
    });
};
