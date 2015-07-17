/*global d3:false*/

var statusColorMap = {
    "success": "LightGreen",
    "fail": "Crimson",
    "skip": "DodgerBlue"
};

var parseWorker = function(tags) {
    "use strict";

    for (var i = 0; i < tags.length; i++) {
        if (!tags[i].startsWith("worker")) {
            continue;
        }

        return parseInt(tags[i].split("-")[1]);
    }

    return null;
};

var initTimeline = function(data, timeExtents) {
    "use strict";

    console.log("extents:", timeExtents);

    // http://bl.ocks.org/bunkat/2338034
    var margin = { top: 10, right: 10, bottom: 100, left: 80 };
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var miniHeight = data.length * 12 + 50;
    var mainHeight = height - miniHeight - 50;

    var x = d3.time.scale()
            .range([0, width])
            .domain(timeExtents);

    var x1 = d3.scale.linear().range([0, width]);

    var y1 = d3.scale.linear()
            .domain([0, data.length])
            .range([0, mainHeight]);
    var y2 = d3.scale.linear()
            .domain([0, data.length])
            .range([0, miniHeight]);

    var chart = d3.select("#timeline-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "chart");

    chart.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", mainHeight);

    var main = chart.append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")")
            .attr("width", width)
            .attr("height", mainHeight)
            .attr("class", "main");

    var laneLines = main.append("g");
    var laneLabels = main.append("g");

    var itemGroups = main.append("g");

    var mini = chart.append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + (mainHeight + margin.top) + ")")
            .attr("width", width)
            .attr("height", mainHeight)
            .attr("class", "mini");

    var brush = d3.svg.brush()
            .x(x)
            .extent(timeExtents);

    function updateLanes() {
        var lines = laneLines.selectAll(".laneLine")
                .data(data, function(d) { return d.key; });

        lines.enter().append("line")
                .attr("x1", margin.right)
                .attr("x2", width)
                .attr("stroke", "lightgray")
                .attr("class", "laneLine");

        lines.attr("y1", function(d, i) { return y1(i); })
                .attr("y2", function(d, i) { return y1(i); });

        lines.exit().remove();

        var labels = laneLabels.selectAll(".laneLabel")
                .data(data, function(d) { return d.key; });

        labels.enter().append("text")
                .text(function(d) { return "Worker #" + d.key; })
                .attr("x", -margin.right)
                .attr("dy", ".5ex")
                .attr("text-anchor", "end")
                .attr("class", "laneLabel");

        labels.attr("y", function(d, i) { return y1(i + 0.5); });

        labels.exit().remove();
    }

    function updateItems() {
        var minExtent = brush.extent()[0];
        var maxExtent = brush.extent()[1];

        var visibleItems = data.map(function(group) {
            return {
                key: group.key,
                values: group.values.filter(function(e) {
                    return e.start_date <= maxExtent && e.end_date >= minExtent;
                })
            };
        });

        var groups = itemGroups.selectAll("g")
                .data(visibleItems, function(d) { return d.key; });

        groups.enter().append("g");

        var rects = groups.selectAll("rect")
            .data(function(d) { return d.values; }, function(d) { return d.name; });

        rects.enter().append("rect")
                .attr("y", function(d) { return y1(parseWorker(d.tags)); })
                .attr("height", 0.8 * y1(1))
                .attr("clip-path", "url(#clip)");

        rects
                .attr("x", function(d) {
                    return x1(d.start_date);
                })
                .attr("width", function(d) {
                    return x1(d.end_date) - x1(d.start_date);
                })
                .attr("fill", function(d) { return statusColorMap[d.status]; });

        rects.exit().remove();
        groups.exit().remove();
    }

    function update() {
        // TODO: move all of the data enter() blocks into update() ?
        // the example seems to be relatively non-idiotmatic d3

        //mini.select(".brush").call(brush.extent(brush.extent())); // ???

        x1.domain(brush.extent());

        updateLanes();
        updateItems();
    }


    brush.on("brush", update);

    mini.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", 1)
            .attr("height", miniHeight - 1);

    update();
};

function loadTimeline(path) { // eslint-disable-line no-unused-vars
    "use strict";

    d3.json(path, function(error, data) {
        if (error) {
            throw error;
        }

        var minStart = null;
        var maxEnd = null;
        data.forEach(function(d) {
            /*eslint-disable camelcase*/
            d.start_date = new Date(d.timestamps[0]);
            if (minStart === null || d.start_date < minStart) {
                minStart = d.start_date;
            }

            d.end_date = new Date(d.timestamps[1]);
            if (maxEnd === null || d.end_date > maxEnd) {
                maxEnd = d.end_date;
            }
            /*eslint-enable camelcase*/
        });

        var nested = d3.nest()
                .key(function(d) { return parseWorker(d.tags); })
                .sortKeys(d3.ascending)
                .entries(data);

        console.log(nested);
        window.nested = nested;

        initTimeline(nested, [ minStart, maxEnd ]);
    });
}
