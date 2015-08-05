/*
 *    (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

window.addEventListener('load', function() {


    //default panel display
    $("#runs-panel").hide();
    $("#gerrit-panel").show();
    $("#run-metadata-panel").hide();

    //dict containing all run_metadata objects, keyed by run_id
    var RUN_METADATA = {};

    //sets the run metdata of the associated run in the proper div
    function show_run_metadata(id) {
        $("#run-metadata-table").html("<thead><th>Key</th><th>Value</th></thead>");
        var meta = RUN_METADATA[id];
        for (var i in meta) {
            var obj = meta[i];
            var row = $("<tr><td>" + obj['key'] + "</td>" +
                        "<td>" + obj['value'] + "</td></tr>");
            $("#run-metadata-table").append(row);
        }
    }

    //run_metadata will be queried from subunit2sql when given run_id
    function get_run_metadata(request, run_id) {
        $.getJSON((request),function(metadata) {
            RUN_METADATA[run_id]=metadata;
        });
    }



    //Takes a list of runs and creates a pretty div for each
    function display_runs(data) {
        $("#runs-panel").show();
        $("#runs-panel").append("<ul id=\"runs-list\"></ul>");

        for (var i in data) {
            var run_obj = data[i];
            //get run_metadata
            var request = 'upstream_api_run_id_' + run_obj['id'] + '.json';
            get_run_metadata(request, run_obj['id']);

            var li = $("<li class =\"run-li\" id=\"run-li-" + i + "\" value=\"" + run_obj['id'] + "\"></li>");
            //on mouseover, show the run_metadata for this run object (li)
            $(li).hover(
                function () {
                    $(this).addClass("highlight");
                    show_run_metadata($(this).attr("value"));
                },
                function () {
                    $(this).removeClass("highlight");
                }
            );

            $(li.append("<a href=" + run_obj['artifacts'] + " target=\"_blank\">" + run_obj['artifacts'] + "\n</a>"));
            $("#runs-list").append(li);
            $("#runs-panel-heading").html("Displaying " + i + " Runs");
        }
        $("#run-metadata-panel").show();
    }


    $('#gerrit-id').keypress(function (e) {
        if (e.which == 13) {
            $( "#gerrit-id-button" ).click();
            return false;
        }
    });


    //click triggers the api call that returns the run data
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