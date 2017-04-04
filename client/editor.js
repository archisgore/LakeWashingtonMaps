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

/****************************************************************************************/
/************************* BEGIN: Validators for cells **********************************/

var isNumber = function(val) {
    var retval = /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
          .test(val);
    return retval;
}

var validateId = function(edtVal) {
    console.log("ValidateId");
    return true;
};

var validateName = function(edtVal) {
    console.log("ValidateName");
    return true;
};

var validateLatitude = function(edtVal) {
    if (!isNumber(edtVal)) {
        Notifier.error("Latitude must be a decimal number between -90 and 90. Ignoring your value: " + edtVal);
        return false;
    }

    var val = parseFloat(edtVal)
    if (val >= -90 && val <= 90) {
        return true;
    }
    Notifier.error("Latitude must be between -90 and 90. Ignoring your value: " + edtVal);
    return false;
};

var validateLongitude = function(edtVal) {
    if (!isNumber(edtVal)) {
        Notifier.error("Longitude must be a decimal number between -180 and 180. Ignoring your value: " + edtVal);
        return false;
    }

    var val = parseFloat(edtVal)
    if (val >= -180 && val <= 180) {
        return true;
    }
    Notifier.error("Longitude must be between -180 and 180. Ignoring your value: " + edtVal);
    return false;
};

var validateExplored = function(edtVal) {
    return true;
};

var validateDepth = function(edtVal) {
    if (!isNumber(edtVal)) {
        Notifier.error("Depth must be a negative decimal number less than zero (submerged wrecks only). Ignoring your value: " + edtVal);
        return false;
    }

    if (parseFloat(edtVal) >= 0) {
        Notifier.error("Depth must be a negative decimal number less than zero (submerged wrecks only). Ignoring your value: " + edtVal);
        return false;
    }

    return true;
};

var validateDescription = function(edtVal) {
    return true;
};

var validateDocumented = function(edtVal) {
    return true;
};

var validateIdentified = function(edtVal) {
    return true;
};

var validateFragile = function(edtVal) {
    return true;
};

var validateAlias = function(edtVal) {
    return true;
};


/************************* END: Validators for cells ************************************/
/****************************************************************************************/


$(document).ready(function() {
    init();
});

var tf;

var init = function() {
    var markers = [];

    $.get("https://raw.githubusercontent.com/archisgore/dive-site-markers/master/markers.json").done(function(cm) {
        markers = JSON.parse(cm);
    }).always(function() {
        displayControls();
        displayMarkerFilterTable(markers);
    });
};


var displayControls = function() {
    var controlsDiv = $("#editor #controls");

    var btnSave = $('<button type="button" value="Save"><img src="/assets/tablefilter/ezEditTable/themes/icn_save.gif" alt/> Save Changes</button>')
    btnSave.appendTo(controlsDiv);
    btnSave.click(function() {
        Notifier.info("Sending data to be saved... please be patient...");

        //Close row editor
        var advancedGrid = tf.extension('advancedGrid');
        var ezEditTable = advancedGrid._ezEditTable;
        ezEditTable.Editable.CloseRowEditor();

        var markers = getMarkersJsonFromTable();
        if (typeof(markers) == "undefined") {
            return;
        }

        //sort markers by id
        markers.wpt.sort(function(a, b) {
            a.id = a.id.toUpperCase();
            b.id = b.id.toUpperCase();

            return a.id.localeCompare(b.id);
        });

        var dupesFound = false;
        //abort on duplicates
        for (var i = 0; i < markers.wpt.length - 1; i++) {
            var wpt1 = markers.wpt[i];
            var wpt2 = markers.wpt[i + 1];
            if (wpt1.id == wpt2.id) {
                dupesFound = true;
                Notifier.warning("Duplicates found for marker: " + wpt1.id);
                console.log("There is a duplicate in the data. This must be fixed in the JSON manually.", wpt1, wpt2);
            }
        }
        if (dupesFound) {
            Notifier.error("Duplicates were found in this data. Unable to save, since there is a risk of overriding legitimate data. Please fix this manually in the json array within github. You can enable Developer Tools in your browser, and look at console logs for the duplicates.");
            return;
        }

        var jsonfile = JSON.stringify(markers, null, 4);
        //console.log(jsonfile);
        $.post("/edit/save", jsonfile, function() {
                Notifier.success("Successfully saved the new markers to github!");
            })
            .fail(function() {
                Notifier.error("There was an error saving the markers to github.");
            });
    });

    var btnAddRow = $('<button type="button" value="Add Row"><img src="/assets/tablefilter/ezEditTable/themes/icn_add.gif" alt/> Add Row</button>')
    btnAddRow.appendTo(controlsDiv);
    btnAddRow.click(function() {
        var advancedGrid = tf.extension('advancedGrid');
        var ezEditTable = advancedGrid._ezEditTable;
        ezEditTable.Editable.AddNewRow();
        Notifier.info("A new row was added to the table. You may now customize it.");
    });

    /*
    var btnRemoveRow = $('<button type="button" value="Remove Row"><img src="/assets/tablefilter/ezEditTable/themes/icn_add.gif" alt/> Add Row</button>')
    btnRemoveRow.appendTo(controlsDiv);
    btnRemoveRow.click(function() {
        var advancedGrid = tf.extension('advancedGrid');
        var ezEditTable = advancedGrid._ezEditTable;
        ezEditTable.Editable.AddNewRow();
        Notifier.info("A new row was added to the table. You may now customize it.");
    });
    */
}

var displayMarkerFilterTable = function(markers) {
    var tableConfig = {
        base_path: "/assets/tablefilter/",
        alternate_rows: true,
        btn_reset: true,
        auto_filter: true,
        auto_filter_delay: 100,
        status_bar: true,
        highlight_keywords: true,
        rows_counter: true,
        loader: true,
        msg_filter: "Filtering...",

        grid_layout: true,
        grid_width: "100%",
        col_4: "select",
        col_7: "select",
        col_8: "select",
        col_9: "select",

        btn_showHide_cols_text: 'Columns▼',

        display_all_text: "< All >",

        extensions: [
            {
                name: 'sort'
            },
            {
                name: 'advancedGrid',
                vendor_path: '/assets/tablefilter/ezEditTable/',
                filename: 'ezEditTable_min.js',
                load_stylesheet: true,
                stylesheet: '/assets/tablefilter/ezEditTable/ezEditTable.css',

                default_selection: 'both',
                auto_save: false,

                editor_model: 'row',

                // ezEditTable configuration properties below:
                selectable: true,
                editable: true,
                cell_editors: [
                    {
                        type: 'input'
                    },
                    {
                        type: 'input'
                    },
                    {
                        type: 'input'
                    },
                    {
                        type: 'input'
                    },
                    {
                        type: 'select',
                        attributes: [
                            ['title', 'Select whether explored']
                        ]
                    },
                    {
                        type: 'input'
                    },
                    {
                        type: 'textarea',
                        allow_empty_value: true
                    },
                    {
                        type: 'select',
                        attributes: [
                            ['title', 'Select whether documented']
                        ]
                    },
                    {
                        type: 'select',
                        attributes: [
                            ['title', 'Select whether identified']
                        ]
                    },
                    {
                        type: 'select',
                        attributes: [
                            ['title', 'Select whether fragile']
                        ]
                    },
                    {
                        type: 'input',
                        allow_empty_value: true
                    }
                ],

                actions: {            
                    'insert': {
                        default_record: ['NONEXISTENT001', 'A wreck has no name', '-90', '0', 'NO', '-10000', "This wreck was added with the add button. Nobody bothered to describe it. Lame.", "NO", "NO", "YES", ""]
                    }        
                },

                validate_modified_value: function(editable, colIndex, cellVal, edtVal, cell, editor) {
                    switch (colIndex) {
                        case 0:
                            return validateId(edtVal);
                        case 1:
                            return validateName(edtVal);
                        case 2:
                            return validateLatitude(edtVal);
                        case 3:
                            return validateLongitude(edtVal);
                        case 4:
                            return validateExplored(edtVal);
                        case 5:
                            return validateDepth(edtVal);
                        case 6:
                            return validateDescription(edtVal);
                        case 7:
                            return validateDocumented(edtVal);
                        case 8:
                            return validateIdentified(edtVal);
                        case 9:
                            return validateFragile(edtVal);
                        case 10:
                            return validateAlias(edtVal);
                    }

                    //Some other column?
                    return false;
                }
            }
        ]
    };

    createMarkersTable(markers);
    var jqmt = $("#markersTable");
    jqmt.appendTo($("#tableholder"));
    jqmt.css("visibility", "visible");
    tf = new TableFilter("markersTable", tableConfig);
    tf.init();
};