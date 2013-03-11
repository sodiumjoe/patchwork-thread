// mock request
var fakeRequest = function(options, callback){
    callback(null, { body: 'raw content' }, 'body');
};

// Library to test
var content = require('../lib/content')(fakeRequest);

exports['test getContent'] = function (test) {
    // test data
    var path = '/',
        path2 = 'assets/something.png',
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
            },
            assets: {
                path: 'assets'
            }
        };

    test.expect(2);
    content.getContent(path, conf, function(err, rawContent){
        test.equal(rawContent.body, 'raw content');
    });
    content.getContent(path2, conf, function(err2, rawContent2){
        test.equal(rawContent2.body, 'raw content');
        test.done();
    });
};

exports['test parseContent'] = function (test) {
    // test data
    var goodYamlFront = {
            body: '---\ntitle: Test Title 1\nweight: 0\narbitrary: things\n---\n\nHello this is the content.\n\n### Hello\n\nMore content.\n\n### Anchor {#anchor}\n\nFinal.'
        },
        badYamlFront = {
            body: 'things'
        },
        parsedObj;

    test.expect(6);
    parsedObj = content.parseContent(goodYamlFront);
    test.equal(parsedObj.title, 'Test Title 1');
    test.equal(parsedObj.weight, 0);
    test.equal(parsedObj.arbitrary, 'things');
    test.equal(parsedObj.body, '<p>Hello this is the content.</p>\n\n<h3>Hello</h3>\n\n<p>More content.</p>\n\n<h3 id="anchor">Anchor </h3>\n\n<p>Final.</p>');

    parsedObj = content.parseContent(badYamlFront);
    test.equal(typeof parsedObj, 'string');
    test.equal(parsedObj, "Error parsing yaml front matter because of no match in file: ");
    test.done();
};

exports['test addExtraMetadata'] = function (test) {
    // test data
    var path = 'test/path/to/object.markdown',
        parsedObj = {},
        newObj;

    test.expect(4);
    newObj = content.addExtraMetadata(parsedObj, path);
    test.equal(newObj.docid, 'test-path-to-object');
    test.equal(newObj.path, 'test/path/to/object');
    test.equal(newObj.category, 'test.path.to');
    test.equal(newObj.weight, 0);
    test.done();
};

// content test data
var path = '/'
  , dataArray = [
        { path: '.dotfile',         type: 'file' }
      , { path: 'test1.markdown',   type: 'file' }
      , { path: 'test2.markdown',   type: 'file' }
      , { path: 'test3.md',         type: 'file' }
      , { path: 'READme.md',        type: 'file' }
      , { path: 'testDir',          type: 'dir' }
      , { path: 'assets',           type: 'dir' }
      , { path: 'dir_to_ignore',    type: 'dir' }
      , { path: 'blog',             type: 'dir' }
    ]
  , dataArray2 = [
        { path: 'testDir/test4.md',         type: 'file' }
      , { path: 'testDir/.nestedDotfile',   type: 'file' }
      , { path: 'testDir/notFileOrDir',     type: 'fake' }
    ]
  , blogDataArray = [
        { path: 'blog/test-blog-post.md',   type: 'file' }
      , { path: 'blog/.nestedDotfile',      type: 'file' }
      , { path: 'blog/notFileOrDir',        type: 'fake' }
    ]
  , conf = {
        github: {
            ghrepo: {
                contents: function(path, callback){
                    if(path === 'testDir'){
                        callback(null, dataArray2);
                    }else if(path === 'blog'){
                        callback(null, blogDataArray);
                    }else{
                        callback(null, dataArray);
                    }
                }
            }
        }
      , assets: {
            path: 'assets'
        }
      , ignore: ['dir_to_ignore']
    }

  , flatTree
  , tree = [ { path: 'one', type: 'file' }
           , { path: 'two', type: 'file' }
           , { path: 'three', type: 'file' }
           , { path: 'four', type: 'dir', children: [ { path: 'four/one', type: 'file' }
                                                    , { path: 'four/two', type: 'file' }
                                                    ]
             }
           , { path: 'five', type: 'file' }
           , { path: 'six', type: 'dir', children: [ { path: 'six/one', type: 'file' }
                                                   , { path: 'six/two', type: 'dir', children: [ { path: 'six/two/one', type: 'file' } ] }
                                                   ]
             }
           ]
  ;



exports['test getContentTree'] = function (test) {
    test.expect(8);
    content.getContentTree(path, conf, function(err, tree){
        test.equal(tree[0].path, 'test1.markdown');
        test.equal(tree[1].path, 'test2.markdown');
        test.equal(tree[2].path, 'test3.md');
        test.equal(tree[3].path, 'testDir');
        test.equal(tree[3].children[0].path, 'testDir/test4.md');
        test.equal(tree[4].path, 'blog');
        test.equal(tree[4].children[0].path, 'blog/test-blog-post.md');
        test.equal(tree.length, 5);
        test.done();
    });
};
exports['test flattenTree'] = function (test) {
    flatTree = content.flattenTree(tree); 
    test.equal(flatTree.length, 8);
    test.done();
};
/*
exports['test getFileList'] = function (test) {
    content.getFileList(conf, function(err, fileList){
        test.equal(fileList[0].path, 'test1.markdown');
        test.equal(fileList[1].path, 'test2.markdown');
        test.equal(fileList[2].path, 'test3.md');
        test.equal(fileList[3].path, 'testDir/test4.md');
        test.equal(fileList[4].path, 'blog/test-blog-post.md');
        test.equal(fileList.length, 5);
        test.done();
    });
};
*/
