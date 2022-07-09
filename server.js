var http = require('http');
var fs = require('fs');
var url = require('url');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var {MongoClient} = require('mongodb');
var dburl = "mongodb://localhost:27017/";
var database;

var formidable = require('formidable');

function connect() {
  MongoClient.connect(dburl, function(err, db) {
    if (err)
        throw err;
    database = db.db("catalogue");
  });
}

function insertMaterial() {
    connect();
    if(database == null)
        return;
    var materialID = document.getElementById("data_id").textContent;
    var obj = { id: materialID };
    database.collection("materials").insertOne(obj, function(err, res) {
        if (err)
            throw err;
        console.log("Inserted into db: " + obj);
        db.close();
    });
}

function clearDatabase() {
    connect();
    database.collection("materials").drop(function(err, delOK) {
        if (err)
            throw err;
        if (delOK)
        console.log("Collection deleted");
        db.close();
    });
}

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    if(req.url == "/") {
        q = url.parse(req.url + "index.html", true);
    }
    var filename = "." + q.pathname;
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 not found");
        } 
        res.writeHead(200, {'Content-Type': 'text/html'});
        return res.end(data);
    });
}).listen(8080);

/*var myEventHandler = function () {
    console.log('I hear a scream!');
}
eventEmitter.on('scream', myEventHandler);
eventEmitter.emit('scream');*/