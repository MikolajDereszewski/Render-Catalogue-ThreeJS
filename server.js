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

function insertMaterial(materialID) {
    MongoClient.connect(dburl, function(err, db) {
        if (err)
            throw err;
        var database = db.db("catalogue");
        var obj = { name: materialID };
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
        database.collection("materials").find({}, { projection: { _id: 0, name: 1 } }).toArray(function(err, result) {
            if (err)
                throw err;
            console.log(result);
            callback(result);
            db.close();
        });
    });
}

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    var awaitEnd=false;
    var awaitContent=false;
    var headPassed=false;

    if (req.url == '/fileUpload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            console.log(fields);
            insertMaterial(fields.setid);
        });
        q = url.parse(req.url + ".html", true);
    }

    if(req.url == "/admin.html") {
        awaitEnd=true;
        getUploadedResources(function(result) {
            if(!headPassed) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                headPassed = true;
            }
            result.forEach(function(item) {
                var onClick = '\'window.open("preview.html?data_id=' + item.name + '","popup","width=500,height=500");\'';
                res.write('<input type = "button" value = "Preview ' + item.name + '" onClick=' + onClick + '/><br>')
            });
            if(!awaitContent) {
                return res.end();
            } else {
                awaitEnd = false;
            }
        });
    }

    if(req.url == "/catalogue.html") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        getUploadedResources(function(result) {
            var nameArray = [];
            result.forEach(function(item) {
                nameArray.push(item.name);
            });
            var json = JSON.stringify(nameArray);
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
            if(!headPassed) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                headPassed = true;
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

clearDatabase();
createCollection();
//insertMaterial("ice_resources");
//logDatabase();
//insertMaterial("ice_resources");
//insertMaterial("brick_resources");
//insertMaterial("tiles_resources");
//logDatabase();

/*var myEventHandler = function () {
    console.log('I hear a scream!');
}
eventEmitter.on('scream', myEventHandler);
eventEmitter.emit('scream');*/