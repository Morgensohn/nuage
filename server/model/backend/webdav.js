var fs = require("webdav-fs");
var Readable = require('stream').Readable;
var toString = require('stream-to-string');

function connect(params){
    return fs(
        params.url,
        params.username,
        params.password
    );
}

function encode(path){
    return path
        .split('/')
        .map(function(link){
            return encodeURIComponent(link);
        })
        .join('/')
}

module.exports = {
    test: function(params){
        return new Promise((done, err) => {
            connect(params).readFile('/', function(error, res){
                if(error){ err(error) }
                else{ done(params) }
            });
        });
    },
    cat: function(path, params){
        path = encode(path);
        return new Promise(function(done, err){
            //path.replace(/\#/g, '%23')
            connect(params).readFile(path, 'binary', function(error, res){
                if(error){ err(error) }
                else{
                    var stream = new Readable();
                    stream.push(res);
                    stream.push(null);
                    done(stream);
                }
            });
        });        
    },
    ls: function(path, params){
        return new Promise((done, err) => {
            //path = encode(path);
            //console.log(path)
            connect(params).readdir(path, function(error, contents) {
                if (!error) {
                    done(contents.map((content) => {
                        return {
                            name: content.name,
                            type: function(cont){
                                if(cont.isDirectory()){
                                    return 'directory';
                                }else if(cont.isFile()){
                                    return 'file'
                                }else{
                                    return null;
                                }
                            }(content),
                            time: content.mtime,
                            size: content.size
                        }
                    }));
                } else {
                    err(error);
                }
            }, 'stat');     
        });
    },
    write: function(path, content, params){
        path = encode(path);
        return toString(content)
            .then((content) => {
                return new Promise((done, err) => {
                    connect(params).writeFile(path, content, function(error) {
                        if(error){ err(error); }
                        else{ done('done'); }
                    });
                });
            });
    },
    rm: function(path, params){
        path = encode(path);
        return new Promise((done, err) => {
            connect(params).unlink(path, function (error) {
                if(error){ err(error) }
                else{ done('ok') }
            });
        });
    },
    mv: function(from, to, params){
        from = encode(from);
        to = encode(to);
        return new Promise((done, err) => {
            connect(params).rename(from, to, function (error) {
                if(error){ err(error) }
                else{ done('ok') }
            });
        });
    },
    mkdir: function(path, params){
        path = encode(path);
        return new Promise((done, err) => {
            connect(params).mkdir(path, function(error) {
                if(error){ err(error); }
                else{ done('done'); }
            });
        });    
    },
    touch: function(path, params){
        path = encode(path);
        return new Promise((done, err) => {
            connect(params).writeFile(path, '', function(error) {
                if(error){ err(error); }
                else{ done('done'); }
            });
        });    
    }
}
