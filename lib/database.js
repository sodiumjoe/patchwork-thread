function addToDB(fileObj, conf, callback){
    var model = 'Doc';
    if(conf.blog.path + '/' === fileObj.path.substring(0, conf.blog.path.length + 1)){
        model = 'Blog';
    }
    conf[model].findOne({'path': fileObj.path}, function(err, doc){
        if(err){
            console.log(err);
            callback(null);
        }else{
            if(doc){
                doc.title = fileObj.title;
                doc.body = fileObj.content;
                doc.path = fileObj.path;
                doc.category = fileObj.category;
                if(fileObj.date){
                    doc.date = fileObj.date;
                    doc.year = fileObj.year;
                    doc.month = fileObj.month;
                    doc.slug = fileObj.slug;
                    doc.excerpt = fileObj.excerpt;
                    doc.img = fileObj.img;
                }
                if(fileObj.redirect){
                    doc.redirect = fileObj.redirect;
                }
                doc.save(function(err){
                    if(err){
                        console.log(err);
                    }
                    callback(null);
                });
            }else{
                var newDoc = new conf[model]({
                    "title": fileObj.title,
                    "body": fileObj.content,
                    "path": fileObj.path,
                    "category": fileObj.category,
                    "date": fileObj.date,
                    "year": fileObj.year,
                    "month": fileObj.month,
                    "slug": fileObj.slug,
                    "img": fileObj.img,
                    "excerpt": fileObj.excerpt,
                    "redirect": fileObj.redirect
                });
                newDoc.save(function(err){
                    if(err){
                        console.log(err);
                    }
                    callback(null);
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
            console.log(err);
        }
        callback(null);
    });
};

exports.addToDB = addToDB;
exports.removeFromDB = removeFromDB;
