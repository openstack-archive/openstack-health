"use strict";

window.addEventListener('load', function() {

    //default panel display
    $("#runs-panel").hide();
    $("#gerrit-panel").show();

    //Takes a list of runs and creates a pretty div for each
    function display_runs(data) {
        $("#runs-panel").show();
        for (var i in data) {
            var run_obj = data[i]
            var div = $("<div class=\"span12\" id=\"run-div-" + i + "\"></div>");
            $(div.append("<a href=" + run_obj['artifacts'] + " target=\"_blank\">" + run_obj['artifacts'] + "\n</a>"));
            $("#runs-panel").append(div);
            $("#runs-panel-heading").html("Displaying " + i + " Runs");
        }
    }

    $('#gerrit-id').keypress(function (e) {
        if (e.which == 13) {
            $( "#gerrit-id-button" ).click();
            return false;
        }
    });

    $('#gerrit-id-button').click(function() {
        var request = 'upstream_api_changeid_'+$("#gerrit-id").val()+'.json';
        $("#runs-panel").append("<a href=\"https://review.openstack.org/" + $("#gerrit-id").val() +
                        "/\" target=\"_blank\"><h2> Change ID: " + $("#gerrit-id").val() + "</h2></a>");
        $("#gerrit-panel").html("Loading Test Runs...");

        $.getJSON((request),function(data) {
            $("#gerrit-panel").hide();
            display_runs(data);
      });
    });


});