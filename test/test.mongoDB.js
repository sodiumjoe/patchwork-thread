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
    docsColl = mongoose.createConnection('localhost', 'testing');
docsColl.on('error', console.error.bind(console, 'connection error:'));
var Doc = docsColl.model('document', docSchema),
    fileObj = {
        title: 'Title 1',
        content: 'Fake contents go here.',
        path: 'fake/path/here',
        category: 'fake.category'
    },
    fileObj2 = {
        title: 'Updated Title 1',
        content: 'Updated fake contents go here.',
        path: 'fake/updated/path/here',
        category: 'fake.category'
    };

suite('DB functions', function(){
    test('addToDB() should add add a doc to MongoDB', function(done){
        Doc.remove({}, function(err){
            if(err){
                console.log(err);
            }
            console.log('collection dropped');
            app.addToDB(fileObj, Doc, function(err2){
                if(err2){
                    console.log(err2);
                }
                Doc.findOne({'path': fileObj.path}, function(err3, doc){
                    if(err3){
                        console.log(err3);
                    }
                    assert.equal(doc.title, fileObj.title, 'Title does not match: ' + fileObj.title);
                    assert.equal(doc.body,fileObj.content, 'Content does not match: ' + fileObj.content);
                    assert.equal(doc.path, fileObj.path, 'Path does not match: ' + fileObj.path);
                    assert.equal(doc.category, fileObj.category, 'Category does not match: ' + fileObj.category);
                    done();
                });
            });
        });
    });
    test('addToDB() should update doc in MongoDB', function(done){
        Doc.remove({}, function(err){
            var newDoc = new Doc({
                title: 'Not Updated Title 1',
                content: 'Not updated fake contents go here.',
                path: 'fake/updated/path/here',
                category: 'fake.not.updated.category'
            });

            newDoc.save(function(err){
                if(err){
                    console.log(err);
                }
                app.addToDB(fileObj2, Doc, function(err){
                    if(err){
                        console.log(err);
                    }
                    Doc.findOne({'path': fileObj2.path}, function(err2, doc){
                        if(err2){
                            console.log(err2);
                        }
                        assert.equal(doc.title, fileObj2.title, 'Title does not match: ' + fileObj2.title);
                        assert.equal(doc.body,fileObj2.content, 'Content does not match: ' + fileObj2.content);
                        assert.equal(doc.path, fileObj2.path, 'Path does not match: ' + fileObj2.path);
                        assert.equal(doc.category, fileObj2.category, 'Category does not match: ' + fileObj2.category);
                        done();
                    });
                });
            });
        });
    });
    test('removeFromDB() should remove doc from MongoDB', function(done){
        Doc.remove({}, function(err){
            var newDoc = new Doc({
                title: 'Deleting',
                content: 'Fake contents for deletion go here.',
                path: 'deleted/path/here',
                category: 'deleted.category'
            });

            app.removeFromDB(fileObj2.path, Doc, function(err){
                if(err){
                    console.log(err);
                }
                Doc.findOne({'path': 'deleted/path/here'}, function(err2, doc){
                    if(err2){
                        console.log(err2);
                    }
                    assert.equal(doc, null, 'Document should be removed: ' + doc.path);
                    done();
                });
            });
        });
    });
});
