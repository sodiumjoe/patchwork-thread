function indexToSearch(fileObj, conf, callback){
    if(conf.searchify.url){
        conf.searchify.client.put('/v1/indexes/' + conf.searchify.index + '/docs', {docid: fileObj.docid, fields: {text: fileObj.content, title: fileObj.title, path: fileObj.path}}, function(err, req, res, obj){
            if(err){
                console.log(err);
                callback(null);
            }else{
                console.log("Indexed to searchify: " + fileObj.path);
                callback(null);
            }
        });
    }else{
        console.log("No searchify url, skipping search index");
        callback(null);
    }
}

function deindexFromSearch(path, conf, callback){
    var delPath = '/v1/indexes/' + conf.searchify.index + '/docs/?' + 'docid=' + path.replace('.markdown','').replace('.md','');
    conf.searchify.client.del(delPath, function(err, req, res){
        if(err){
            callback(err);
        }else{
            console.log('deindexed from searchify: ' + path);
            callback(null);
        }
    });
}

exports.indexToSearch = indexToSearch;
exports.deindexFromSearch = deindexFromSearch;
