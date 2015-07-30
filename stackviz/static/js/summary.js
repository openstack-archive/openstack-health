"use strict";

/*
    <div class="col-lg-12">
        <div class="panel panel-default">
            <div class="panel-heading">Test Runs</div>
            <div class="panel-body" id="run-summary-div">

            </div>
        </div>
    </div>
*/

//@param data: JSON data of the test run
function getData(data) {

    var num_successes = 0;
    var num_failures = 0;
    var num_skipped = 0
    var total_time = 0;
    var longest_test={duration: 0};

    function calculateChildrenTime(i) {
        var dur = 0;
            if (typeof i.duration !== "undefined") {
                if (i.status=="success") num_successes++;
                else if (i.status=="fail") num_failures++;
                else if (i.status=="skip") num_skipped++;

                if (longest_test.duration < i.duration)
                    longest_test = i;

                dur = i.duration;
            }
            else {
                for (var k in i.children) {
                    dur += calculateChildrenTime(i.children[k]);
                }
            }
        return dur;
    }

    total_time=calculateChildrenTime(data);

    var data_dict= { "Successes": num_successes,
                    "Failures": num_failures,
                    "Skipped": num_skipped,
                    "Total Time": total_time.toFixed(2),
                    "Longest Test": longest_test.name + " ("+longest_test.duration+")"};

    return data_dict;
}


function createTable(data, run) {

    $('#run-summary-div').append("<div class='col-lg-6'><div class='panel panel-default'> " +
    "<div class='panel-heading'><a href='tempest_timeline_" + run + ".html'>Run #" + run + "</a>" +
    "</div><div class='panel-body' id='run-" + run + "-div'></div>");

    var data_dict = getData(data);
    var tbl = document.createElement('table');
    tbl.setAttribute("id","table-run-" + run);
    tbl.setAttribute("class","table table-bordered table-hover table-striped");
    for (var key in data_dict) {
            var row = tbl.insertRow();
            var c1 = row.insertCell();
            c1.innerHTML=key;
            var c2 = row.insertCell();
            c2.innerHTML=data_dict[key];
    }

    document.getElementById("run-"+run+"-div").appendChild(tbl);

}


//@param run_id: The method is passed the latest run_id so it can populate the tables moving backwards
function createTables(entries) {
    entries.forEach(function(entry) {
        //TODO: Sort tables when inserting so they appear in correct order
        d3.json(entry.url, function(error, data) {
            if (error) throw error;
            //create a table for the info
            createTable(data, entry.run);
        });
    })
}
