var express = require('express');
var app = express();
var edit = require("./edit");
var cookieParser = require('cookie-parser')

// Convenience for allowing CORS on routes - GET only
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.set('port', (process.env.PORT || 8080));

app.use("/assets", express.static('assets'));
app.use(express.static('.'));
app.use(cookieParser());

app.use("/edit", edit.editRouter());

app.get("/", function(req, res) {
    res.sendFile("index.html", {
        root: "./client"
    });
});

app.get("/map.js", function(req, res) {
    res.sendFile("map.js", {
        root: "./client"
    });
});

app.get("/editor.js", function(req, res) {
    res.sendFile("editor.js", {
        root: "./client"
    });
});

app.get("/table.js", function(req, res) {
    res.sendFile("table.js", {
        root: "./client"
    });
});

app.get("*", function(req, res) {
    res.redirect(302, "/");
});


app.listen(app.get('port'), function() {
    console.log('Scuba Dive Maps listening on port ' + app.get('port') + '!');
});