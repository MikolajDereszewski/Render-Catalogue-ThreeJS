var http = require('http');
var fs = require('fs');
var url = require('url');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var {MongoClient} = require('mongodb');
var dburl = "mongodb://localhost:27017/";

var formidable = require('formidable');
var uuid = require('uuid');

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
            height: heightName,
            u_normalScale: 1.0,
            u_heightScale: 0.0,
            u_AOScale: 1.0,
            u_tiling_x: 1,
            u_tiling_y: 1,
            u_roughnessRemap_x: 0.0,
            u_roughnessRemap_y: 1.0
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

function updateMaterialUniforms(materialID, uniforms) {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        var query = { name: materialID };
        var newUniforms = { $set:{
            u_normalScale: uniforms.u_normalScale,
            u_heightScale: uniforms.u_heightScale,
            u_AOScale: uniforms.u_AOScale,
            u_tiling_x: uniforms.u_tiling_x,
            u_tiling_y: uniforms.u_tiling_y,
            u_roughnessRemap_x: uniforms.u_roughnessRemap_x,
            u_roughnessRemap_y: uniforms.u_roughnessRemap_y
        }};
        console.log("Try update collection");
        database.collection("materials").updateOne(query, newUniforms, function(err, res) {
            if (err)
                throw err;
            console.log("1 document updated");
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

const users = {
    "admin": "1234"
}

class Session {
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt
    }
    
    isExpired() {
        this.expiresAt < (new Date())
    }
}

const sessions = {}

function parseCookies (request) {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

function isUserLogged(req) {
    var cookies = parseCookies(req);
    if (!cookies) {
        return false;
    } else {
        const sessionToken = cookies['session_token']
        if (!sessionToken) {
            return false;
        } else {
            userSession = sessions[sessionToken]
            if (!userSession) {
                return false;
            } else {
                if (userSession.isExpired()) {
                    delete sessions[sessionToken];
                    return false;
                } else {
                    return true;
                }
            }
        }
    }
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
    if (req.url == '/update') {
        awaitEnd = true;
        q = url.parse("/admin", true);
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if(fields.updateid == null || fields.updateid == "") {
                if(!awaitContent) {
                    return res.end();
                } else {
                    awaitEnd = false;
                }
            }
            else {
                var uniforms = {
                    u_normalScale: fields.u_normalScale,
                    u_heightScale: fields.u_heightScale,
                    u_AOScale: fields.u_AOScale,
                    u_tiling_x: fields.u_tiling_x,
                    u_tiling_y: fields.u_tiling_y,
                    u_roughnessRemap_x: fields.u_roughnessRemap_x,
                    u_roughnessRemap_y: fields.u_roughnessRemap_y
                }
                console.log(uniforms);
                updateMaterialUniforms(fields.updateid, uniforms);
            }
        });
    }
    if(q.pathname == "/admin" || q.pathname == "/admin.html") {
        q = url.parse("/admin.html", true);
        res.writeHead(200, {'Content-Type': 'text/html'});
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if(!isUserLogged(req)) {
                var login = fields.login;
                var password = fields.password;
                if (!login || !password) {
                    q = url.parse("/login.html", true);
                } else {
                    const expectedPassword = users[login];
                    if (!expectedPassword || expectedPassword !== password) {
                        q = url.parse("/login.html", true);
                    }
                    else {
                        const sessionToken = uuid.v4();
                        const now = new Date();
                        const expiresAt = new Date(+now + 3600 * 1000);
                        const session = new Session(login, expiresAt);
                        sessions[sessionToken] = session;
                        console.log(sessionToken);
                        res.writeHead(200, {
                            'Set-Cookie': 'session_token='+sessionToken.toString()+'; expires='+expiresAt.toUTCString()+'; path=/;"',
                            'Content-Type': 'text/html'
                        });
                        console.log(res.cookieHeader);
                    }
                }
            }
            var filename = "." + q.pathname;
            fs.readFile(filename, function(err, data) {
                if (err) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    return res.end("404 not found");
                }
                res.write(data);
                return res.end();
            });
        });
    }
    else if(q.pathname == "/material") {
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
                        height: result[0].height,
                        u_normalScale: result[0].u_normalScale,
                        u_heightScale: result[0].u_heightScale,
                        u_AOScale: result[0].u_AOScale,
                        u_tiling_x: result[0].u_tiling_x,
                        u_tiling_y: result[0].u_tiling_y,
                        u_roughnessRemap_x: result[0].u_roughnessRemap_x,
                        u_roughnessRemap_y: result[0].u_roughnessRemap_y
                    };
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
                    height: item.height,
                    u_normalScale: item.u_normalScale,
                    u_heightScale: item.u_heightScale,
                    u_AOScale: item.u_AOScale,
                    u_tiling_x: item.u_tiling_x,
                    u_tiling_y: item.u_tiling_y,
                    u_roughnessRemap_x: item.u_roughnessRemap_x,
                    u_roughnessRemap_y: item.u_roughnessRemap_y
                });
            });
            var json = JSON.stringify(dataArray);
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
            if(req.url == "/styles/styles.css") {
                res.writeHead(200, {'Content-Type': 'text/css'});
            }
            else {
                res.writeHead(200, {'Content-Type': 'text/html'});
            }
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