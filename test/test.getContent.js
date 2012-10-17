var assert = require('assert'),
    fs = require('fs'),
    app = require('./../app'),
    github = require('octonode'),
    client = github.client(),
    ghrepo = client.repo('joebadmo/indexer');

suite('parseContent', function(){
    test('parseContent on test1.markdown should parse the content', function(done){
        fs.readFile('./test/test-data/test1.markdown', 'utf8', function(err, rawContent){
            if(err){
                console.log(err);
            }
            app.parseContent('test/test-data/test1.markdown', rawContent, function (err, parsedObj){
                assert.equal(parsedObj.title, 'Test', 'Title does not match: ' + parsedObj.title);
                assert.equal(parsedObj.weight, 0, 'Weight does not match: ' + parsedObj.weight);
                assert.equal(parsedObj.content, "This is the first test file.\n", 'Content does not match: ' + parsedObj.content);
                assert.equal(parsedObj.docid, "test-test-data-test1", 'DocID does not match: ' + parsedObj.docid);
                assert.equal(parsedObj.path, "test/test-data/test1", 'Path does not match: ' + parsedObj.path);
                assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
                done();
            });
        });
    });
    test('parseContent on test2.markdown should parse the content', function(done){
        fs.readFile('./test/test-data/test2.markdown', 'utf8', function(err, rawContent){
            if(err){
                console.log(err);
            }
            app.parseContent('test/test-data/test2.markdown', rawContent, function(err, parsedObj){
                assert.equal(parsedObj.title, 'Test Number Two', 'Title does not match: ' + parsedObj.title);
                assert.equal(parsedObj.weight, 1, 'Weight does not match: ' + parsedObj.weight);
                assert.equal(parsedObj.content, "This is the second test file.\n", 'Content does not match: ' + parsedObj.content);
                assert.equal(parsedObj.docid, "test-test-data-test2", 'DocID does not match: ' + parsedObj.docid);
                assert.equal(parsedObj.path, "test/test-data/test2", 'Path does not match: ' + parsedObj.path);
                assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
                done();
            });
        });
    });
    test('parseContent on test3.md should parse the content', function(done){
        fs.readFile('./test/test-data/test3.md', 'utf8', function(err, rawContent){
            if(err){
                console.log(err);
            }
            app.parseContent('test/test-data/test3.md', rawContent, function(err, parsedObj){
                assert.equal(parsedObj.title, 'Test 3', 'Title does not match: ' + parsedObj.title);
                assert.equal(parsedObj.weight, 2, 'Weight does not match: ' + parsedObj.weight);
                assert.equal(parsedObj.content, "This is the third test file.\n", 'Content does not match: ' + parsedObj.content);
                assert.equal(parsedObj.docid, "test-test-data-test3", 'DocID does not match: ' + parsedObj.docid);
                assert.equal(parsedObj.path, "test/test-data/test3", 'Path does not match: ' + parsedObj.path);
                assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
                done();
            });
        });
    });
});

// Requires GitHub API calls
/*suite('getContent', function(){
    test('getContent on test1.markdown should get and parse the content', function(done){
        app.getContent('test/test-data/test1.markdown', ghrepo, 'joebadmo/indexer', function(err, parsedObj){
            if(err){
                console.log(err);
            }
            assert.equal(parsedObj.title, 'Test', 'Title does not match: ' + parsedObj.title);
            assert.equal(parsedObj.weight, 0, 'Weight does not match: ' + parsedObj.weight);
            assert.equal(parsedObj.content, "This is the first test file.\n", 'Content does not match: ' + parsedObj.content);
            assert.equal(parsedObj.docid, "test-test-data-test1", 'DocID does not match: ' + parsedObj.docid);
            assert.equal(parsedObj.path, "test/test-data/test1", 'Path does not match: ' + parsedObj.path);
            assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
            done();
        });
    });
    test('getContent on test2.markdown should parse the content', function(done){
        app.getContent('test/test-data/test2.markdown', ghrepo, 'joebadmo/indexer', function(err, parsedObj){
            if(err){
                console.log(err);
            }
            assert.equal(parsedObj.title, 'Test Number Two', 'Title does not match: ' + parsedObj.title);
            assert.equal(parsedObj.weight, 1, 'Weight does not match: ' + parsedObj.weight);
            assert.equal(parsedObj.content, "This is the second test file.\n", 'Content does not match: ' + parsedObj.content);
            assert.equal(parsedObj.docid, "test-test-data-test2", 'DocID does not match: ' + parsedObj.docid);
            assert.equal(parsedObj.path, "test/test-data/test2", 'Path does not match: ' + parsedObj.path);
            assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
            done();
        });
    });
    test('getContent on test3.md should parse the content', function(done){
        app.getContent('test/test-data/test3.md', ghrepo, 'joebadmo/indexer', function(err, parsedObj){
            if(err){
                console.log(err);
            }
            assert.equal(parsedObj.title, 'Test 3', 'Title does not match: ' + parsedObj.title);
            assert.equal(parsedObj.weight, 2, 'Weight does not match: ' + parsedObj.weight);
            assert.equal(parsedObj.content, "This is the third test file.\n", 'Content does not match: ' + parsedObj.content);
            assert.equal(parsedObj.docid, "test-test-data-test3", 'DocID does not match: ' + parsedObj.docid);
            assert.equal(parsedObj.path, "test/test-data/test3", 'Path does not match: ' + parsedObj.path);
            assert.equal(parsedObj.category, "test.test-data", 'Category does not match: ' + parsedObj.category);
            done();
        });
    });
});*/
