var assert = require('assert'),
	app = require('./../app'),
    github = require('octonode'),
    client = github.client(),
	ghrepo = client.repo('joebadmo/indexer');


suite('parseContent', function() {
  test('parseContent on test1.markdown should parse the content', function(done) {
    app.parseContent('test/test-data/test1.markdown', ghrepo, 'joebadmo/indexer', function(err, parsedObj) {
		if(err){
			console.log(err);
		}else{
			assert.equal(parsedObj.title, 'Test', 'Title does not match: ' + parsedObj.title);
		}
      done();
    });
  });
});
