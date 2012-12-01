var async = require('async');
// Libarary to test
var database = require('../lib/database'),
    fakeConf = (function() {
        var Doc = function(obj){
            this.obj = obj;
            this.save = function(callback){
                fakeDB.doc.created = this.obj;
                fakeDB.doc.created.saved = true;
                callback(null);
            };
        };
        Doc.findOne = function(pathObj, callback){
            if(pathObj.path === 'path/to/oldobject'){
                callback(null, fakeDB.doc.old);
            }else if(pathObj.path === 'path/to/existing/redirect'){
                callback(null, fakeDB.redirect.old);
            }else{
                callback(null, null);
            }
        };
        Doc.save = function(callback){
            callback(null);
        };
        var Blog = function(obj){
            this.obj = obj;
            this.save = function(callback){
                fakeDB.blog.created = this.obj;
                fakeDB.blog.created.saved = true;
                callback(null);
            };
        };
        Blog.findOne = function(pathObj, callback){
            if(pathObj.path === 'blog/existing/post'){
                callback(null, fakeDB.blog.old);
            }else{
                callback(null, null);
            }
        };
        Blog.save = function(callback){
            callback(null);
        };
        return {
            blog: {
                path: 'blog'
            },
            Doc: Doc,
            Blog: Blog
        };
    })();

var fakeDB = {
        doc: {
            created: {},
            old: {
                save: function(callback){
                    fakeDB.doc.old.saved = true;
                    callback(null);
                },
                saved: false
            },
        },
        redirect: {
            created: {},
            old: {
                save: function(callback){
                    fakeDB.redirect.old.saved = true;
                    callback(null);
                },
                saved: false
            },
        },
        blog: {
            created: {},
            old: {
                save: function(callback){
                    fakeDB.blog.old.saved = true;
                    callback(null);
                },
                saved: false
            }
        }
    },
    fakeExistingDoc = {
        path: 'path/to/oldobject',
        title: 'Updated Thing',
        content: 'Hello again, world',
        category: 'cat1'
    },
    fakeExistingPost = {
        path: 'blog/existing/post',
        title: 'Existing Blog Post',
        content: 'This one is updated',
        category: 'blogcat',
        date: 'today',
        year: '2012',
        month: '12',
        slug: 'post',
        excerpt: 'This one...',
        img: 'path/to/img.png'
    },
    fakeNewDoc = {
        path: 'path/to/newobject',
        title: 'New Thing',
        content: 'Hello world',
        category: 'cat2'
    },
    fakeNewPost = {
        path: 'blog/new/post2',
        title: 'New Blog Post',
        content: 'This one is new',
        category: 'blogcat2',
        date: 'today',
        year: '2012',
        month: '12',
        slug: 'post2',
        excerpt: 'This one... new',
        img: 'path/to/img2.png'
    },
    fakeExistingRedirect = {
        path: 'path/to/existing/redirect',
        title: 'Old Redirect',
        content: 'going somewhere else',
        category: 'cat3',
        redirect: 'other/place'
    },
    fakeNewRedirect = {
        path: 'path/to/new/redirect',
        title: 'New Redirect',
        content: 'going somewhere',
        category: 'cat4',
        redirect: 'other/new/place'
    };

exports['test database.addToDb'] = {
    'update existing document': function (test) {
        database.addToDB(fakeExistingDoc, fakeConf, function(err){
            test.equal(fakeDB.doc.old.path, 'path/to/oldobject');
            test.equal(fakeDB.doc.old.title, 'Updated Thing');
            test.equal(fakeDB.doc.old.content, 'Hello again, world');
            test.equal(fakeDB.doc.old.category, 'cat1');
            test.equal(fakeDB.doc.old.saved, true);
            test.done();
        });
    }, 
    'create new document': function (test) {
        database.addToDB(fakeNewDoc, fakeConf, function(err){
            test.equal(fakeDB.doc.created.path, 'path/to/newobject');
            test.equal(fakeDB.doc.created.title, 'New Thing');
            test.equal(fakeDB.doc.created.content, 'Hello world');
            test.equal(fakeDB.doc.created.category, 'cat2');
            test.equal(fakeDB.doc.created.saved, true);
            test.done();
        });
    }, 
    'update existing blog post': function (test) {
        database.addToDB(fakeExistingPost, fakeConf, function(err){
            test.equal(fakeDB.blog.old.path, 'blog/existing/post');
            test.equal(fakeDB.blog.old.title, 'Existing Blog Post');
            test.equal(fakeDB.blog.old.content, 'This one is updated');
            test.equal(fakeDB.blog.old.category, 'blogcat');
            test.equal(fakeDB.blog.old.date, 'today');
            test.equal(fakeDB.blog.old.year, '2012');
            test.equal(fakeDB.blog.old.month, '12');
            test.equal(fakeDB.blog.old.slug, 'post');
            test.equal(fakeDB.blog.old.excerpt, 'This one...');
            test.equal(fakeDB.blog.old.img, 'path/to/img.png');
            test.equal(fakeDB.blog.old.saved, true);
            test.done();
        });
    }, 
    'create new blog post': function (test) {
        database.addToDB(fakeNewPost, fakeConf, function(err){
            test.equal(fakeDB.blog.created.path, 'blog/new/post2');
            test.equal(fakeDB.blog.created.title, 'New Blog Post');
            test.equal(fakeDB.blog.created.content, 'This one is new');
            test.equal(fakeDB.blog.created.category, 'blogcat2');
            test.equal(fakeDB.blog.created.date, 'today');
            test.equal(fakeDB.blog.created.year, '2012');
            test.equal(fakeDB.blog.created.month, '12');
            test.equal(fakeDB.blog.created.slug, 'post2');
            test.equal(fakeDB.blog.created.excerpt, 'This one... new');
            test.equal(fakeDB.blog.created.img, 'path/to/img2.png');
            test.equal(fakeDB.blog.created.saved, true);
            test.done();
        });
    },
    'update existing redirect': function(test){
        database.addToDB(fakeExistingRedirect, fakeConf, function(err){
            test.equal(fakeDB.redirect.old.path, 'path/to/existing/redirect');
            test.equal(fakeDB.redirect.old.title, 'Old Redirect');
            test.equal(fakeDB.redirect.old.content, 'going somewhere else');
            test.equal(fakeDB.redirect.old.category, 'cat3');
            test.equal(fakeDB.redirect.old.redirect, 'other/place');
            test.equal(fakeDB.redirect.old.saved, true);
            test.done();
        });
    },
    'create new redirect': function(test){
        database.addToDB(fakeNewRedirect, fakeConf, function(err){
            test.equal(fakeDB.doc.created.path, 'path/to/new/redirect');
            test.equal(fakeDB.doc.created.title, 'New Redirect');
            test.equal(fakeDB.doc.created.content, 'going somewhere');
            test.equal(fakeDB.doc.created.category, 'cat4');
            test.equal(fakeDB.doc.created.redirect, 'other/new/place');
            test.done();
        });
    }
};
