function addToDB (fileObj, conf, callback) {
    conf.Doc.findOne({'path': fileObj.path}, function(err, doc){
        if(err){
            callback(err);
        }else{
            if(doc){
                doc.title = fileObj.title;
                doc.body = fileObj.content;
                doc.path = fileObj.path;
                doc.category = fileObj.category;
                if(fileObj.redirect){
                    doc.redirect = fileObj.redirect;
                }
                doc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        console.log(fileObj.path + ' updated in mongodb');
                        callback(null);
                    }
                });
            }else{
                var newDoc = new conf.Doc({
                    "title": fileObj.title,
                    "body": fileObj.content,
                    "path": fileObj.path,
                    "category": fileObj.category
                });
                if(fileObj.redirect){
                    newDoc.redirect = fileObj.redirect;
                }
                newDoc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        console.log(fileObj.title + ' added to mongodb');
                        callback(null);
                    }
                });
            }
        }
    });
}

function removeFromDB(path, conf, callback){
    conf.Doc.find({'path': path.replace('.markdown','').replace('.md','')}).remove(function(err){
        if(err){
            callback(err);
        }else{
            console.log(path + ' removed from DB');
            callback(null);
        }
    });
}

exports.addToDB = addToDB;
exports.removeFromDB = removeFromDB;
