/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var https = require('https');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static(__dirname +'/public'));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function geoTag(latitude, longitude, name, hashtag) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.hashtag = hashtag;
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var serverTagList = [];

function searchGeoTagsByName(name, long, lat) {
    app.locals.taglist = [];

    var latitude = null;
    var longitude = null;
    var distance = 5000;

    serverTagList.forEach( function(element, index, localTagList){
        if (localTagList[index].name.search(name) >= 0) {

            if(long && lat) {
                latitude = lat;
                longitude = long;

                var longDist = Math.pow(localTagList[index].longitude - longitude,2);
                var latDist = Math.pow(localTagList[index].latitude - latitude,2);
                if (distance >= Math.sqrt(latDist + longDist)) {
                    app.locals.taglist.push(localTagList[index]);
                }
            } else {
                app.locals.taglist.push(localTagList[index]);
            }
        }
    });
}

function addGeoTag(geoTag) {
    serverTagList.push(geoTag);
}

// addGeoTag(new geoTag(12.0000,12.0000,'bla','#asdasd'));

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */
app.get("/", function(req, res) {
    var latitude = null;
    var longitude = null;

    if(req.body.latitude && req.body.longitude) {
        latitude = req.body.latitude;
        longitude = req.body.longitude;
    }

    res.render(__dirname + '/views/gta.ejs', {
        taglist: serverTagList,
        latitude: latitude,
        longitude: longitude
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post("/tagging", function(req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var name = req.body.name;
    var hashtag = req.body.hashtag;

    addGeoTag(new geoTag(latitude, longitude, name, hashtag));

    res.redirect('/');
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post("/discovery", function(req, res) {
    var name = req.body.search;

    var latitude = null;
    var longitude = null;

    if(req.body.latitude && req.body.longitude) {
        latitude = req.body.latitude;
        longitude = req.body.longitude;
    }

    var filteredTags = [];
    serverTagList.forEach( function(element, index, serverTagList){
        if (serverTagList[index].name.search(name) >= 0) {
            filteredTags.push(serverTagList[index]);
        }
    });

    if ("Apply" in req.body) {
        searchGeoTagsByName(name, req.body.longitude, req.body.latitude);
        res.render(__dirname + '/views/gta.ejs', {
            taglist: filteredTags,
            latitude: latitude,
            longitude: longitude
        });
    }
});

/**
 * Setze Port und speichere in Express.
 */

/**
 * Erstelle HTTPS Server
 */

var options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yuri0r.ddns.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yuri0r.ddns.net/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/yuri0r.ddns.net/chain.pem')
}

var server = https.createServer(options, app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(443);
