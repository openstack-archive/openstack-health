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

var runId = null;

function populateTable(d, textColor) {
    var oldtbl = document.getElementById("result-table-div");
    oldtbl.innerHTML = "";
    var tbl = document.createElement('table');
    tbl.setAttribute("id","test-table");
    tbl.setAttribute("class","table table-bordered table-hover table-striped");
        if (typeof d.children == "undefined") {
            for (var key in d) {
                if (key=="status" || key=="name_full" || key=="name" || key=="duration" || key=="tags" || key=="timestamps") {
                    var row = tbl.insertRow();
                    var td1 = row.insertCell();
                    var td2 = row.insertCell();
                    td1.innerHTML = key;
                    td2.innerHTML = d[key];
                }
            }
            document.getElementById("result-table-div").appendChild(tbl);
            document.getElementById("table-heading").innerHTML=d.name;
            addDialogButton("#result-table-div",runId);
            showDetails(d);
        }
        else {
            for (var j in d.children) {
                var row = tbl.insertRow();
                var td1 = row.insertCell();
                var td2 = row.insertCell();
                td1.innerHTML = d.children[j].name;
                td2.innerHTML = calculateChildrenTime(d.children[j]).toFixed(2);
                td1.style.color = textColor(d.children[j]);
                document.getElementById("result-table-div").appendChild(tbl);
                document.getElementById("table-heading").innerHTML=d.name +
                    ": " + calculateChildrenTime(d).toFixed(2) + " seconds"
                $( "table-test" ).DataTable();
            }
        }
}

function calculateChildrenTime(i) {
     var dur = 0;
     if (typeof i.duration !== "undefined") {
         dur = i.duration;
     }
     else {
        for (var k in i.children) {
            dur += calculateChildrenTime(i.children[k]);
        }
     }
     return dur;
}

function displayFailingTests(d) {

    document.getElementById("failure-table-div").innerHTML="";
    var tbl = document.createElement('table');
    tbl.setAttribute("id","failure-table");
    tbl.setAttribute("class","table table-bordered table-hover table-striped");

    function findFailingTests(i,result) {
            if (i.status == "fail") {
                result.push(i);
            }
            else {
                for (var k in i.children) {
                    findFailingTests(i.children[k],result);
                }
            }
            return;
    }

    var failureList=[];

    findFailingTests(d,failureList);
    for (var row in failureList) {
        var newRow = tbl.insertRow();
        newRow.setAttribute("class","failure-row");
        var td1 = newRow.insertCell();
        var td2 = newRow.insertCell();
        td1.innerHTML = failureList[row].name_full;
        td2.innerHTML = parseFloat(failureList[row].duration).toFixed(2);
    }

    document.getElementById("failure-table-div").appendChild(tbl);
    $( "#failure-table-div" ).hide();
}


function createSunburst(url, run_id) {
    runId = run_id;

    var width = 700,
        height = 500,
        radius = Math.min(width, height) / 2;

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.sqrt()
        .range([0, radius]);

    var color = d3.scale.category20c();

    var svg = d3.select("#sunburst").append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

    var partition = d3.layout.partition()
        .value(function(d) { return d.duration; });

    var arc = d3.svg.arc()
       .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    d3.json(url, function(error, root) {
        if (error) throw error;

        displayFailingTests(root);

        var path = svg.selectAll("path")
            .data(partition.nodes(root))
          .enter().append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.name); })
            .on("click", click);

        function click(d) {
            path.transition()
              .duration(750)
              .attrTween("d", arcTween(d));
            populateTable(d,mouse);
        }

        function mouse(d) { return color(d.name); }

    });

    d3.select(self.frameElement).style("height", height + "px");

    // Interpolate the scales!
    function arcTween(d) {
      var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
          yd = d3.interpolate(y.domain(), [d.y, 1]),
          yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
      return function(d, i) {
          return i
            ? function(t) { return arc(d); }
            : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
      };
    }


}
