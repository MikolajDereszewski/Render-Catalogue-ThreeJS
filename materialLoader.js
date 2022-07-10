
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
