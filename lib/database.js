function addToDB(fileObj, conf, callback){
    var model = 'Doc';
    if(conf.blog.path + '/' === fileObj.path.substring(0, conf.blog.path.length + 1)){
        model = 'Blog';
    }
    conf[model].findOne({'path': fileObj.path}, function(err, doc){
        if(err){
            callback(err);
        }else{
            if(doc){
                doc.title = fileObj.title;
                doc.body = fileObj.content;
                doc.path = fileObj.path;
                doc.category = fileObj.category;
                doc.date = fileObj.date;
                if(fileObj.redirect){
                    doc.redirect = fileObj.redirect;
                }
                doc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        callback(null);
                    }
                });
            }else{
                var newDoc = new conf[model]({
                    "title": fileObj.title,
                    "body": fileObj.content,
                    "path": fileObj.path,
                    "category": fileObj.category,
                    "date": fileObj.date,
                    "redirect": fileObj.redirect
                });
                newDoc.save(function(err){
                    if(err){
                        callback(err);
                    }else{
                        callback(null);
                    }
                });
            }
        }
    });
};

function removeFromDB(path, conf, callback){
    var model = 'Doc';
    if(conf.blog.path === fileObj.path.substring(0, conf.blog.path.length)){
        model = 'Blog';
    }
    conf[model].find({'path': path.replace('.markdown','').replace('.md','')}).remove(function(err){
        if(err){
            callback(err);
        }else{
            callback(null);
        }
    });
};

exports.addToDB = addToDB;
exports.removeFromDB = removeFromDB;
