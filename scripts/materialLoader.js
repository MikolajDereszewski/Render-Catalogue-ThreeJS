function loadMaterialData(callbackPerMaterial) {
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function() {
        var arr = JSON.parse(this.responseText);
        console.log(arr);
        arr.forEach(function(item) {
            callbackPerMaterial(item);
        });
    }
    xhttp.open("GET", "/catalogue.html");
    xhttp.send();
}

function loadSingleMaterialData(name, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function() {
        var data = JSON.parse(this.responseText);
        console.log(data);
        callback(data);
    }
    xhttp.open("GET", "/material?name=" + name, true);
    xhttp.send();
}