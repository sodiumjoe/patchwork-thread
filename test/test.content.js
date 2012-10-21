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

var goodYamlFront = '---\ntitle: "Test Title 1"\n---';
var badYamlFront = 'things';

exports['test parseContent'] = function (test) {
    test.expect(2);
    content.parseContent(goodYamlFront, function(err, parsedObj){
        test.equal(parsedObj.title, 'Test Title 1');
        content.parseContent(badYamlFront, function(err, parsedObj){
            test.equal(typeof parsedObj, 'undefined');
            test.done();
        });
    });

};
