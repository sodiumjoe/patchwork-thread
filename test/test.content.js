// Test override function
var fakeRequest = function(options, callback){
    callback(null, { body: 'raw content' }, 'body');
};

// Library to test
var content = require('../lib/content')(fakeRequest);

exports['test parseDir'] = function (test) {
    // test data
    var path = '',
        dataArray = [
            {
                path: '.dotfile',
                type: 'file'
            },
            {
                path: 'test1.markdown',
                type: 'file'
            },
            {
                path: 'test2.markdown',
                type: 'file'
            },
            {
                path: 'test3.md',
                type: 'file'
            }
        ],
        conf = {
            github: {
                ghrepo: {
                    contents: function(p, callback){
                        callback(null, dataArray);
                    }
                }
            }
        },
        testContainer = [],
        fileFunc = function(p, callback){
            testContainer.push(p);
            callback(null);
        };

    test.expect(3);
    content.parseDir(path, conf, fileFunc, function(err, rawContent){
        test.equal(testContainer[0], 'test1.markdown');
        test.equal(testContainer[1], 'test2.markdown');
        test.equal(testContainer[2], 'test3.md');
        test.done();
    });
};

exports['test getContent'] = function (test) {
    // test data
    var path = '/',
        conf = {
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

    test.expect(1);
    content.getContent(path, conf, function(err, rawContent){
        test.equal(rawContent, 'raw content');
        test.done();
    });
};

exports['test parseContent'] = function (test) {
    // test data
    var goodYamlFront = '---\ntitle: "Test Title 1"\nweight: 0\narbitrary: things\n---\n\nHello this is the content.',
        badYamlFront = 'things';

    test.expect(6);
    content.parseContent(goodYamlFront, function(err, parsedObj){
        test.equal(parsedObj.title, 'Test Title 1');
        test.equal(parsedObj.weight, 0);
        test.equal(parsedObj.arbitrary, 'things');
        test.equal(parsedObj.content, 'Hello this is the content.');

        content.parseContent(badYamlFront, function(err, parsedObj){
            test.equal(typeof parsedObj, 'undefined');
            test.equal(err, "Error parsing yaml front matter because of no match in file: ");
            test.done();
        });
    });
};

exports['test addExtraMetadata'] = function (test) {
    // test data
    var path = 'test/path/to/object.markdown',
        parsedObj = {};

    test.expect(4);
    content.addExtraMetadata(parsedObj, path, function(err, newObj){
        test.equal(newObj.docid, 'test-path-to-object');
        test.equal(newObj.path, 'test/path/to/object');
        test.equal(newObj.category, 'test.path.to');
        test.equal(newObj.weight, 0);
        test.done();
    });
};

