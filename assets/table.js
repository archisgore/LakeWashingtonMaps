var getMarkersJsonFromTable = function() {
    var table = $("#markersTable");
    if (table.length != 1) {
        Notifier.error("Something is very wrong. More than one markers table found.", table);
        return;
    }

    var rows = table.find("tbody tr");

    var wpts = [];

    rows.each(function(index, row) {
        var wpt = rowToMarker(row);
        if (typeof(wpt) != "undefined") {
            wpts.push(wpt);
        } else {
            Notifier.error("Some rows could not be converted into markers. Unable to save for risk of overwriting data. Aborting save. Look at Row number: "+ (index+1));
            return;
        }
    });

    return {
        wpt: wpts
    };
}

var rowToMarker = function(row) {
    var tds = $(row).find("td");
    if (tds.length != 11) {
        Notifier.error("Something is very wrong. Number of columns in the row (" + tds.length + ") was not the expected number 11.");
        return;
    }

    var wpt = {
        id: $(tds[0]).text(),
        name: $(tds[1]).text(),
        lat: $(tds[2]).text(),
        lng: $(tds[3]).text(),
        explored: $(tds[4]).text(),
        depth: $(tds[5]).text(),
        desc: $(tds[6]).text(),
        documented: $(tds[7]).text(),
        identified: $(tds[8]).text(),
        fragile: $(tds[9]).text(),
        alias: $(tds[10]).text()
    };

    return wpt;
}

var markerToRow = function(wpt) {
    var tr = $("<tr></tr>");
    tr.append($("<td>" + wpt.id + "</td>"));
    tr.append($("<td>" + wpt.name + "</td>"));
    tr.append($("<td>" + wpt.lat + "</td>"));
    tr.append($("<td>" + wpt.lng + "</td>"));
    tr.append($("<td>" + wpt.explored + "</td>"));
    tr.append($("<td>" + wpt.depth + "</td>"));
    tr.append($("<td>" + wpt.desc + "</td>"));
    tr.append($("<td>" + wpt.documented + "</td>"));
    tr.append($("<td>" + wpt.identified + "</td>"));
    tr.append($("<td>" + wpt.fragile + "</td>"));
    tr.append($("<td>" + wpt.alias + "</td>"));

    if (typeof(map) != "undefined") {
        $(tr).click(function() {
            map.setCenter(new google.maps.LatLng(wpt.lat, wpt.lng));
            map.setZoom(13);
            hideMarkerFilterTable();
            showInfoWindow(wpt);
        });
    }

    return tr;
}


var createMarkersTable = function(markers) {

    $("#markersTable").remove();

    var table = $("<table id=\"markersTable\" style=\"visibility:hidden\"></table>");

    var tbody = $("<tbody></tbody>");
    var thead = $("<thead></thead>");

    var trhead = $("<tr></tr>");
    trhead.append($("<td>Id</td>"));
    trhead.append($("<td>Name</td>"));
    trhead.append($("<td>Latitude</td>"));
    trhead.append($("<td>Longitude</td>"));
    trhead.append($("<td>Explored</td>"));
    trhead.append($("<td>Depth</td>"));
    trhead.append($("<td>Description</td>"));
    trhead.append($("<td>Documented</td>"));
    trhead.append($("<td>Identified</td>"));
    trhead.append($("<td>Fragile</td>"));
    trhead.append($("<td>Alias</td>"));
    thead.append(trhead);

    markers.wpt.forEach(function(wpt) {
        var tr = markerToRow(wpt);
        tbody.append(tr);
    });

    table.append(thead);
    table.append(tbody);

    $("#marker-container").append(table);
}