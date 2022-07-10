var http = require('http');
var fs = require('fs');
var url = require('url');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var {MongoClient} = require('mongodb');
var dburl = "mongodb://localhost:27017/";

var formidable = require('formidable');

function createCollection() {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        console.log("Try create collection");
        database.createCollection("materials", function(err, res) {
            if (err)
                throw err;
            console.log("Collection created!");
            db.close();
        });
    });
}

function insertMaterial(materialID, albedoName, normalName, metallicName, roughnessName, AOName, heightName) {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        var obj = {
            name: materialID,
            albedo: albedoName,
            normal: normalName,
            metallic: metallicName,
            roughness: roughnessName,
            AO: AOName,
            height: heightName
        };
        console.log("Try insert into collection");
        database.collection("materials").insertOne(obj, function(err, res) {
            if (err)
                throw err;
            console.log("Inserted into db: " + obj);
            logDatabase();
            db.close();
        });
    });
}

function clearDatabase() {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        console.log("Try clear collection");
        database.collection("materials").drop(function(err, res) {
            if (err)
                throw err;
            console.log("Collection deleted");
            db.close();
        });
    });
}

function logDatabase() {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        database.collection("materials").find().toArray(function(err, result) {
            if (err)
                throw err;
            console.log(result);
            db.close();
        });
    });
}

function getUploadedResources(callback) {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        database.collection("materials").find({}, { projection: { _id: 0 } }).toArray(function(err, result) {
            if (err)
                throw err;
            callback(result);
            db.close();
        });
    });
}

function getSingleUploadedResource(name, callback) {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        database.collection("materials").find({"name" : name}, { projection: { _id: 0 } }).toArray(function(err, result) {
            if (err)
                throw err;
            callback(result);
            db.close();
        });
    });
}

function uploadFile(file, id, callback) {
    //console.log(file);
    if(file==null) {
        callback('null');
    }
    var oldpath = file.filepath;
    var path = 'D:/Projekty/Render-Catalogue-ThreeJS/scene-content/' + id + '/'
    var newpath = path + file.originalFilename;
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    fs.copyFile(oldpath, newpath, function (err) {
        if (err)
            throw err;
        callback('scene-content/' + id + '/' + file.originalFilename);
    });
}

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    var awaitEnd=false;
    var awaitContent=false;

    if (req.url == '/fileUpload.html') {
        awaitEnd = true;
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if(fields.setid == null || fields.setid == "") {
                if(!awaitContent) {
                    return res.end();
                } else {
                    awaitEnd = false;
                }
            }
            else {
                uploadFile(files.basemap, fields.setid, function(albedoName) {
                    uploadFile(files.normal, fields.setid, function(normalName) {
                        uploadFile(files.metallic, fields.setid, function(metallicName) {
                            uploadFile(files.roughness, fields.setid, function(roughnessName) {
                                uploadFile(files.AO, fields.setid, function(AOName) {
                                    uploadFile(files.height, fields.setid, function(heightName) {
                                        insertMaterial(fields.setid, albedoName, normalName, metallicName, roughnessName, AOName, heightName);
                                        if(!awaitContent) {
                                            return res.end();
                                        } else {
                                            awaitEnd = false;
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    }
    if(q.pathname == "/material") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        var name = q.query.name;
        if(name == null || name == "") {
            if(!awaitContent) {
                return res.end();
            } else {
                awaitEnd = false;
            }
        }
        else {
            getSingleUploadedResource(name, function(result) {
                if(result == null || result.length == 0) {
                    if(!awaitContent) {
                        return res.end();
                    } else {
                        awaitEnd = false;
                    }
                } else {
                    var data = {
                        name: result[0].name,
                        albedo: result[0].albedo,
                        normal: result[0].normal,
                        metallic: result[0].metallic,
                        roughness: result[0].roughness,
                        AO: result[0].AO,
                        height: result[0].height
                    };
                    console.log(data);
                    var json = JSON.stringify(data);
                    res.write(json);
                    return res.end();
                }
                
            });
        }
    }
    else if(req.url == "/catalogue.html") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        getUploadedResources(function(result) {
            var dataArray = [];
            result.forEach(function(item) {
                dataArray.push( {
                    name: item.name,
                    albedo: item.albedo,
                    normal: item.normal,
                    metallic: item.metallic,
                    roughness: item.roughness,
                    AO: item.AO,
                    height: item.height
                });
            });
            var json = JSON.stringify(dataArray);
            console.log(json);
            res.write(json);
            return res.end();
        });
    }
    else {
        if(req.url == "/") {
            q = url.parse(req.url + "index.html", true);
        }
        var filename = "." + q.pathname;
        awaitContent=true;
        fs.readFile(filename, function(err, data) {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end("404 not found");
            } 
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            if(!awaitEnd) {
                return res.end();
            } else {
                awaitContent = false;
            }
        });
    }
}).listen(8080);

logDatabase();
//clearDatabase();
//createCollection();