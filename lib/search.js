function indexToSearch(fileObj, searchifyIndex, searchifyClient, callback){
    searchifyClient.put('/v1/indexes/' + searchifyIndex + '/docs', {docid: fileObj.docid, fields: {text: fileObj.content, title: fileObj.title, path: fileObj.path}}, function(err, req, res, obj){
        if(err){
            callback(err);
        }else{
            console.log("Indexed to searchify: " + fileObj.path);
            callback(null);
        }
    });
}

function deindexFromSearch(path, searchifyIndex, searchifyClient, callback){
    var delPath = '/v1/indexes/' + searchifyIndex + '/docs/?' + 'docid=' + path.replace('.markdown','').replace('.md','');
    searchifyClient.del(delPath, function(err, req, res){
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
