
"use strict";

var originalDetailsContent = null;

var detailsCache = null;
var detailsInProgress = false;
var detailsWaiting = [];
var runId = null;

var loadDetails = function(callback) {
    if (detailsCache === null) {
        detailsWaiting.push(callback);

        if (!detailsInProgress) {
            var url = "tempest_api_details_" + runId + ".json";
            if ("{{use_gzip}}" === "True") {
                url += ".gz";
            }

            detailsInProgress = true;

            d3.json(url, function(error, data) {
                if (error) {
                    throw error;
                }

                detailsCache = data;
                detailsWaiting.forEach(function(cb) {
                    cb(detailsCache);
                });
            });
        }
    } else {
        callback(detailsCache);
    }
};

var showDetails = function(item) {
    var parent = $("#details-dialog");

    loadDetails(function(details) {
        if (!details.hasOwnProperty(item.name_full)) {
            console.log("Details not found for item:", item.name_full);
            return;
        }

        if (originalDetailsContent === null) {
            originalDetailsContent = parent.html();
        }

        parent.empty();
        for (var prop in details[item.name_full]) {
            $("<h3>").text(prop).appendTo(parent);
            $("<pre>").text(details[item.name_full][prop]).appendTo(parent);
        }
    });
};

function addDialogButton(parentID, run_id) {
    //parentID: A string contiaining the parent div id to which the button will be appended
    runId=run_id;
    var button = $('<button/>',
    {
        text: 'View Log',
        click: function() {$("#details-dialog").dialog("open");}
    });

    $(parentID).append(button);

    $("#details-dialog").dialog({
      dialogClass: 'ui-dialog',
      autoOpen: false,
      width: 800,
      height: 500,
      buttons: [
        {
          text: "OK",
          click: function() {
            $( this ).dialog( "close" );
          }
        }
      ]

    });

}
