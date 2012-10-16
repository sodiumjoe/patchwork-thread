var yaml = require('yamlparser');

exports.parse = function(input, callback){
    //regex to find yaml front matter
    var regex = /^\s*---[\s\S]+?---\s*/gi;
    var match = regex.exec(input);
    if(match){
        var yamlString = match[0];
        var parsedObj = yaml.eval(yamlString);
        parsedObj.content = input.replace(match[0], '');
        callback(null, parsedObj);
    }else{
        callback("Error parsing yaml file: ")
    }
}
