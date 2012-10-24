function parse (req, callback){
    var errorThrown = false;
    try{
        var payloadObj = JSON.parse(req.body.payload),
            repository = payloadObj.repository.owner.name + '/' + payloadObj.repository.name,
            lastCommit = payloadObj.commits[payloadObj.commits.length - 1],
            updated = lastCommit.added.concat(lastCommit.modified),
            removed = lastCommit.removed,
            deltaObj = {
                repository: repository,
                updated: updated,
                removed: removed
            };

    }catch(err){
        callback(err);
        errorThrown = true;
    }

    if(!errorThrown){
        callback(null, deltaObj);
    }
}

exports.parse = parse;
