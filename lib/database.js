function addToDB (fileObj, mongoDoc, callback) {
    mongoDoc.findOne({'path': fileObj.path}, function(err, doc){
        if(err){
            callback(err);
        }else{
            if(doc){
                doc.title = fileObj.title;
                doc.body = fileObj.content;
                doc.path = fileObj.path;
                doc.category = fileObj.category;
                doc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        console.log(fileObj.path + ' added to mongodb');
                        callback(null);
                    }
                });
            }else{
                var newDoc = new mongoDoc({
                    title: fileObj.title,
                    body: fileObj.content,
                    path: fileObj.path,
                    category: fileObj.category
                });

                newDoc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        console.log(fileObj.title + ' updated mongodb');
                        callback(null);
                    }
                });
            }
        }
    });
}

function removeFromDB(path, mongoDoc, callback){
    mongoDoc.find({'path': path.replace('.markdown','').replace('.md','')}).remove(function(err){
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
