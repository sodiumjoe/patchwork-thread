var assert = require('assert'),
    app = require('./../app'),
    mongoose = require('mongoose'),
    docSchema = new mongoose.Schema({
    title: String,
    weight: Number,
    body: String,
    category: String,
    path: String,
    tags:[]
}),
    docsColl = mongoose.createConnection('localhost', 'testdocuments');
docsColl.on('error', console.error.bind(console, 'connection error:'));
var Doc = docsColl.model('testdocument', docSchema),
    fileObj = {
        title: 'Title 1',
        weight: 0,
        content: 'Fake contents go here.',
        docid: 'fake.docid.here',
        path: 'fake/path/here',
        category: 'fake.category'
    };
    
/*mongoose.connection.collections['testdocument'].drop(function(err){
    if(err){
        console.log(err);
    }else{
        console.log('collection dropped');
    }
});*/

suite ('DB functions', function() {
    test ('DB functions should add and remove from MongoDB', function(done) {
        app.addToDB(fileObj, Doc, function(err){
            if(err){
                console.log(err);
            }
            Doc.findOne({'path': fileObj.path}, function(err2, doc){
                if(err2){
                    console.log(err2);
                }
                console.log(doc.title);
                assert.equal(doc.title, fileObj.title, 'Title does not match: ' + fileObj.title);
                /*assert.equal(doc.weight, fileObj.weight, 'Weight does not match: ' + fileObj.weight);
                assert.equal(doc.content,fileObj.content, 'Content does not match: ' + fileObj.content);
                assert.equal(doc.docid, fileObj.docid, 'docid does not match: ' + fileObj.docid);
                assert.equal(doc.path, fileObj.path, 'Path does not match: ' + fileObj.path);
                assert.equal(doc.category, fileObj.category, 'Category does not match: ' + fileObj.category);*/
                done();
            });
        });
    });
});
