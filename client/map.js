/*
    This file is part of Exploration Maps (maps.archisgore.com).

    Exploration Maps is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Exploration Maps is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with Exploration Maps.  If not, see <http://www.gnu.org/licenses/>.
*/
var map;
var originalHash;
var resizeTable;
var infoWindow;
var tableDiv;
var tf;
var bagOverlay;
var demOverlay;
var gueBathyOverlay;
var gueSidescanOverlay;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 47.6265680181,
            lng: -122.2952169015
        },
        zoom: 9,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN],
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false

    });


    // Normalizes the coords that tiles repeat across the x axis (horizontally)
    // like the standard Google map tiles.
    var getNormalizedCoord = function(coord, zoom) {
        var y = coord.y;
        var x = coord.x;

        // tile range in one direction range is dependent on zoom level
        // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
        var tileRange = 1 << zoom;

        // don't repeat across y-axis (vertically)
        if (y < 0 || y >= tileRange) {
            return null;
        }

        // repeat across x-axis
        if (x < 0 || x >= tileRange) {
            x = (x % tileRange + tileRange) % tileRange;
        }

        return {
            x: x,
            y: y
        };
    }

    var weirdOffset = function(n) {
        var offset = 3.52733954850628;
        return Math.sign(n) * Math.abs(n - offset) / 2 * 60 * 60 * 60;
    }

    bagOverlay = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            var normalizedCoord = getNormalizedCoord(coord, zoom);
            if (!normalizedCoord) {
                return null;
            }
            var bound = Math.pow(2, zoom);
            return 'http://gis.ngdc.noaa.gov/arcgis/rest/services/bag_hillshades/ImageServer/tile/' +
                +zoom + '/' + normalizedCoord.y + '/' + normalizedCoord.x;
        },
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        name: 'Bathymetry',
        alt: 'Bathymetry from NOAA'
    });


    demOverlay = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            var bounds = map.getBounds();
            var ne = bounds.getNorthEast();

            lat1 = weirdOffset(ne.lat());
            lng1 = weirdOffset(ne.lng());

            var sw = bounds.getSouthWest();
            lat2 = weirdOffset(sw.lat());
            lng2 = weirdOffset(sw.lng());
            console.log(lng2 + " " + lat1 + " " + lng1 + " " + lat2);
            //-122.213,47.527
            //"http://gis.ngdc.noaa.gov/arcgis/rest/services/dem_hillshades/ImageServer/exportImage?f=image&interpolation=RSP_BilinearInterpolation&compressionQuality=90&bbox=" + lat1 + "%2C" + lng1 + "%2C" + lat2 + "%2C" + lng2 + "&imageSR=102100&bboxSR=102100&size=255%2C255"
            console.log("http://gis.ngdc.noaa.gov/arcgis/rest/services/dem_hillshades/ImageServer/exportImage?f=image&interpolation=RSP_BilinearInterpolation&compressionQuality=90&bbox=" + lng2 + "%2C" + lat2 + "%2C" + lng1 + "%2C" + lat1 + "&imageSR=102100&bboxSR=102100&size=255%2C255")
        },
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        name: 'Digital Elevation Model',
        alt: 'DEM from NOAA'
    });

    gueBathyOverlay = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            var normalizedCoord = getNormalizedCoord(coord, zoom);
            if (!normalizedCoord) {
                return null;
            }
            var bound = Math.pow(2, zoom);
            return 'http://www.gue-seattle.org/maps/tiles/bathy/lw' +
                '/' + zoom + '/' + normalizedCoord.x + '/' +
                (bound - normalizedCoord.y - 1) + '.png';

        },
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        name: 'GUE Seattle Bathymetry',
        alt: 'Bathymetry from GUE Seattle'
    });

    gueSidescanOverlay = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            var normalizedCoord = getNormalizedCoord(coord, zoom);
            if (!normalizedCoord) {
                return null;
            }
            var bound = Math.pow(2, zoom);
            return 'http://www.gue-seattle.org/maps/tiles/sidescan/lu' +
                '/' + zoom + '/' + normalizedCoord.x + '/' +
                (bound - normalizedCoord.y - 1) + '.png';
        },
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        name: 'GUE Seattle Sidescan',
        alt: 'Sidescan from GUE Seattle'
    });

    // Construct a single InfoWindow.
    infoWindow = new google.maps.InfoWindow({
        content: "You cheated!"
    });

    displayMarkers(infoWindow);
    originalHash = window.location.hash;

    attachEditButton();
    attachHelpButton();
    attachOverlaysDropdown();
}


var displayMarkers = function(infoWindow) {

    var markers
    $.get("https://raw.githubusercontent.com/archisgore/dive-site-markers/master/markers.json").done(function(cm) {
        markers = JSON.parse(cm);
    }).always(function() {
        var filteredMarkers = markers.wpt;
        try {
            //we create the markers table to see if there's filtering done:
            createMarkersTable(markers);

            var tableConfig = {
                base_path: "/assets/tablefilter/",
                state: {
                    types: ['hash'],
                }
            };
            cleanTf();
            tf = new TableFilter("markersTable", tableConfig);
            tf.init();
            var rows = $("#markersTable tbody tr:visible");
            //console.log(rows);
            filteredMarkers = [];

            rows.each(function(index, tr) {
                var id = $($(tr).children(":first")[0]).text();
                markers.wpt.forEach(function(wpt) {
                    if (wpt.id == id) {
                        filteredMarkers.push(wpt);
                    }
                });
            });
        } catch (e) {}

        filteredMarkers.forEach(function(wpt) {
            if (!wpt) return;
            var latlng = new google.maps.LatLng(wpt.lat, wpt.lng);
            var markerOpts = {
                position: latlng,
                map: map,
                title: wpt.name,
            };

            wpt.marker = new google.maps.Marker(markerOpts);
            // Opens the InfoWindow when marker is clicked.

            wpt.marker.addListener('click', function() {
                showInfoWindow(wpt);
            });

            //if window hash is on us, open it
            if (window.location.hash.split("#")[1] == wpt.id) {
                map.setCenter(latlng);
                map.setZoom(13);
                showInfoWindow(wpt);
            }
        });

        attachMarkerFilterButton(infoWindow, markers);
    });

    google.maps.event.addListener(map, "click", function(event) {
        infoWindow.close();
        window.location.hash = originalHash;
    });

    google.maps.event.addListener(infoWindow, 'closeclick', function() {
        window.location.hash = originalHash;
    });
};


var showInfoWindow = function(wpt) {
    window.location.hash = wpt.id;
    var windowContent = createMarkerInfo(wpt, wpt.id);
    infoWindow.setContent(windowContent);
    hideMarkerFilterTable();
    infoWindow.open(map, wpt.marker);
}

var getGpsCoord = function(value, max) {
  //Expected input in decimal format
  var sign = value < 0 ? -1 : 1;

  var abs = Math.abs(Math.round(value * 1000000));

  if (abs > (max * 1000000)) {
      return NaN;
  }

  var dec = abs % 1000000 / 1000000;
  var deg = Math.floor(abs / 1000000) * sign;
  var min = Math.floor(dec * 60);
  var sec = (dec - min / 60) * 3600;

  return "" + deg + "° " + (min + (sec/60.0));
}

var createMarkerInfo = function(wpt, fragment) {
    var point = new GeoPoint(Math.abs(wpt.lng), Math.abs(wpt.lat));
    var EW = wpt.lng == Math.abs(wpt.lng) ? "E" : "W";
    var NS = wpt.lat == Math.abs(wpt.lat) ? "N" : "S";

    var gpslat = getGpsCoord(wpt.lat, 90)
    var gpslng = getGpsCoord(wpt.lng, 180)

    return "<table>" +
        "<caption>" + wpt.id + "</caption>" +
        //"<tr><td colspan=\"2\">Find Nearest: <a href=\"\">Street</a> <a href=\"\">Boat Launch</a></td></tr>" +
        "<tr><td colspan=\"2\">Open In: <a href=\"https://www.google.com/maps/place/" + encodeURIComponent(point.getLatDeg() + NS) + "+" + encodeURIComponent(point.getLonDeg() + EW) + "/@" + wpt.lat + "," + wpt.lng + ",17z\">Google Maps</a> <a href=\"http://maps.apple.com/?q=" + wpt.lat + "," + wpt.lng + "\">Apple Maps</a></td></tr>" +
        "<tr><td>Name:</td><td>" + wpt.name + "</td></tr>" +
        "<tr><td>Position:</td><td>Decimal: (" + wpt.lat + ", " + wpt.lng + ")</td></tr>" +
        "<tr><td></td><td>GPS: (" + gpslat + ", " + gpslng + ")</td></tr>" +
        "<tr><td></td><td>Deg: (" + point.getLatDeg() + NS + ", " + point.getLonDeg() + EW + ")</td></tr>" +
        "<tr><td>Explored:</td><td>" + wpt.explored + "</td></tr>" +
        "<tr><td>Description:</td><td>" + wpt.desc + "</td></tr>" +
        "<tr><td>Depth:</td><td>" + wpt.depth + "</td></tr>" +
        "<tr><td>Documented:</td><td>" + wpt.documented + "</td></tr>" +
        "<tr><td>Identified:</td><td>" + wpt.identified + "</td></tr>" +
        "<tr><td>Fragile:</td><td>" + wpt.fragile + "</td></tr>" +
        "<tr><td>Alias:</td><td>" + wpt.alias + "</td></tr>" +
        "</table>";
};

var displayMarkerFilterTable = function(markers) {
    var tableConfig = {
        base_path: "/assets/tablefilter/",
        alternate_rows: true,
        auto_filter: true,
        auto_filter_delay: 100,
        btn_reset: true,
        btn: false,
        status_bar: true,
        highlight_keywords: true,
        rows_counter: true,
        loader: true,

        msg_filter: "Filtering...",

        grid_layout: true,
        grid_width: "99%",

        col_4: "select",
        col_7: "select",
        col_8: "select",
        col_9: "select",

        display_all_text: "All",

        extensions: [{
            name: 'sort'
        }],

        state: {
            types: ['hash'],
        }
    };

    try {
        createMarkersTable(markers);
        $(tableDiv).empty();
        $(tableDiv).append($("#markersTable"));
        $(tableDiv).append("<hr/><div id=\"proTip\"><input type=\"button\" value=\"Apply Filter\" onClick=\"window.location.reload()\"/><i><b>ProTip</b>: Once you have a query you like, refresh the page to &quot;apply it&quot; You can use advanced filtering operators like &lt; (less than or equals), &lt;= (less than), &gt; (greater than), &gt;= (greater than or equals), = (equals), * (wildcard), ! (logical NOT), || (logical OR), && (logical AND), [empty] (to match empty), [nonempty] (to match non-empty), rgx: (for a regular expression.)</i></div></div>");
        $("#markersTable").css("visibility", "visible");
        tableDiv.style.visibility = "visible";
        cleanTf();
        tf = new TableFilter("markersTable", tableConfig);
        tf.init();
    } catch (e) {
        //console.log("Error: " + e);
        createMarkersTable(markers);
        $(tableDiv).empty();
        $(tableDiv).append($("#markersTable"));
        $(tableDiv).append("<hr/><div id=\"proTip\"><input type=\"button\" value=\"Apply Filter\" onClick=\"window.location.reload()\"/><i><b>ProTip</b>: Once you have a query you like, refresh the page to &quot;apply it&quot; You can use advanced filtering operators like &lt; (less than or equals), &lt;= (less than), &gt; (greater than), &gt;= (greater than or equals), = (equals), * (wildcard), ! (logical NOT), || (logical OR), && (logical AND), [empty] (to match empty), [nonempty] (to match non-empty), rgx: (for a regular expression.)</i></div></div>");
        tableDiv.style.visibility = "visible";
        $("#markersTable").css("visibility", "visible");
        window.location.hash = "";
        cleanTf();
        tf = new TableFilter("markersTable", tableConfig);
        tf.init();
    }

    resizeTable()
    google.maps.event.trigger(map, 'resize');

};

var hideMarkerFilterTable = function() {
    if (tableDiv) {
        tableDiv.style.visibility = "hidden";
        $(tableDiv).empty();
        resizeTable()
        google.maps.event.trigger(map, 'resize');
    }
    cleanTf();
};


var attachMarkerFilterButton = function(infoWindow, markers) {
    function MarkerFilterButton(controlDiv, map) {

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.marginTop = '10px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to filter the markers on the map';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.fontWeight = '400';
        controlText.style.lineHeight = '20px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';
        controlText.innerHTML = 'Filter Points';
        controlUI.appendChild(controlText);

        tableDiv = document.createElement('div');
        controlUI.appendChild(tableDiv);

        tableDiv.id = "markersTableDiv";
        tableDiv.style.visibility = "hidden";

        resizeTable = function(eventObject) {
            if (tableDiv.style.visibility == "visible") {
                width = Math.floor($(window).width() * 9.0 / 10.0);
                height = Math.floor($(window).height() * 9.0 / 10.0);
                width = Math.max(Math.min(width, 1000), 200);
                tableDiv.style.width = width + "px"; //use 60% of the window width
                tableDiv.style.height = height + "px"; //use 80% of the window height
                tableDiv.style.zindex = "top";

                tableHeightPx = height - $("#tblHeadCont_markersTable.grd_headTblCont").height() - $("#inf_markersTable.grd_inf").height() - $("div#proTip").height() - 40;
                $("#tblCont_markersTable.grd_tblCont").css("height", tableHeightPx + "px");
            } else {
                tableDiv.style.width = "";
                tableDiv.style.height = "";
            }
        };

        $(window).resize(resizeTable);
        resizeTable();

        controlText.addEventListener('click', function() {
            if (tableDiv.style.visibility == "visible") {
                hideMarkerFilterTable();
            } else {
                infoWindow.close();
                window.location.hash = originalHash;
                displayMarkerFilterTable(markers);
            }
        });

        google.maps.event.addListener(map, "click", function(event) {
            hideMarkerFilterTable();
        });

    }

    // Create the DIV to hold the Filter Button Control
    var filterMarkerButtonDiv = document.createElement('div');
    var filterMarkerButton = new MarkerFilterButton(filterMarkerButtonDiv, map);

    filterMarkerButtonDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(filterMarkerButtonDiv);
};

var cleanTf = function() {
    //console.log("CleanTF: " + tf);
    if (tf) {
        try {
            tf.destroy();
        } catch (e) {}
    }
};




var attachHelpButton = function() {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '5px';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginRight = '20px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Help me understand what I am looking at!';

    // Set CSS for the control interior.
    var controlText = document.createElement('a');
    controlText.href = "https://github.com/archisgore/ScubaDiveMap";
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.fontWeight = '400';
    controlText.style.lineHeight = '20px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Help!';
    controlUI.appendChild(controlText);

    controlUI.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlUI);
};


var attachEditButton = function() {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginTop = '5px';
    controlUI.style.marginRight = '20px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Edit data used by these maps!';

    // Set CSS for the control interior.
    var controlText = document.createElement('a');
    controlText.href = "/edit";
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.fontWeight = '400';
    controlText.style.lineHeight = '20px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Edit Data';
    controlUI.appendChild(controlText);

    controlUI.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlUI);
};

var attachOverlaysDropdown = function() {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginLeft = '20px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to add overlays on the map';

    // Set CSS for the control interior.
    var controlSelect = document.createElement('select');
    controlSelect.style.color = 'rgb(25,25,25)';
    controlSelect.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlSelect.style.fontSize = '12px';
    controlSelect.style.fontWeight = '400';
    controlSelect.style.lineHeight = '20px';
    controlSelect.style.paddingLeft = '5px';
    controlSelect.style.paddingRight = '5px';
    controlSelect.style.borderWidth = '0px';

    var noneOption = document.createElement("option");
    noneOption.innerHTML = "No Overlay";
    controlSelect.appendChild(noneOption);

    var bagOption = document.createElement("option");
    bagOption.innerHTML = "NOAA Bathymetry";
    controlSelect.appendChild(bagOption);

    var demOption = document.createElement("option");
    demOption.innerHTML = "NOAA Digital Elevation Model";
    controlSelect.appendChild(demOption);

    var gueBathyOption = document.createElement("option");
    gueBathyOption.innerHTML = "GUE Seattle Bathymetry";
    controlSelect.appendChild(gueBathyOption);

    var gueSidescanOption = document.createElement("option");
    gueSidescanOption.innerHTML = "GUE Seattle Sidescan";
    controlSelect.appendChild(gueSidescanOption);

    controlSelect.addEventListener("change", function(event) {
        var option = controlSelect.options[controlSelect.selectedIndex];

        //clear overlays
        while (map.overlayMapTypes.length > 0) map.overlayMapTypes.pop();

        if (option.innerHTML == "NOAA Bathymetry") {
            map.overlayMapTypes.push(bagOverlay);
        } else if (option.innerHTML == "NOAA Digital Elevation Model") {
            map.overlayMapTypes.push(demOverlay);
        } else if (option.innerHTML == "GUE Seattle Bathymetry") {
            map.overlayMapTypes.push(gueBathyOverlay);
        } else if (option.innerHTML == "GUE Seattle Sidescan") {
            map.overlayMapTypes.push(gueSidescanOverlay);
        }
    });

    controlUI.appendChild(controlSelect);


    controlUI.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlUI);
};
