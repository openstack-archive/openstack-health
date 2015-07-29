"use strict";

/*
                <div class="table-responsive" id="overview-table-div">
                    <table class="table table-bordered table-hover table-striped" id="overview-table">
                        <tr>
                            <td>    Total Time: </td>
                            <td id="cell-total-time"></td>
                        </tr>
                        <tr>
                            <td>    Successes: </td>
                            <td id="cell-successes"></td>
                        </tr>
                        <tr>
                            <td>    Failures: </td>
                            <td id="cell-failures"></td>
                        </tr>
                        <tr>
                            <td>    Longest Test: </td>
                            <td id="cell-longest-test"></td>
                        </tr>
                    </table>
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

    var data_dict = getData(data);
    var tbl = document.createElement('table');
    tbl.setAttribute("id","table-run-" + run);
    tbl.setAttribute("class","table table-bordered table-hover table-striped");
    var header = tbl.createTHead();
    header.innerHTML = '<tr><th><a href="tempest_timeline_' + run + '.html"> Run #' + run + '</a></th></tr>';
    for (var key in data_dict) {
            var row = tbl.insertRow();
            var c1 = row.insertCell();
            c1.innerHTML=key;
            var c2 = row.insertCell();
            c2.innerHTML=data_dict[key];
    }

    document.getElementById("run-summary-div").appendChild(tbl);

}


//@param run_id: The method is passed the latest run_id so it can populate the tables moving backwards
function createTables(run_id) {

    for (var i=run_id; i>=0; --i) {
        //outer function so callback can use i "synchronously"
        //TODO: Sort tables when inserting so they appear in correct order
        !function(ii) {
            d3.json("tempest_api_tree_" + i + ".json", function(error, data) {
                if (error) throw error;
                //create a table for the info
                createTable(data, ii);

            });
        }(i)
    }

}