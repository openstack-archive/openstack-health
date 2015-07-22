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

var initTimeline = function(options, data, timeExtents) {
    "use strict";

    // http://bl.ocks.org/bunkat/2338034
    var margin = { top: 20, right: 10, bottom: 10, left: 80 };
    var width = 800 - margin.left - margin.right;
    var height = 350 - margin.top - margin.bottom;

    var miniHeight = data.length * 12 + 30;
    var mainHeight = height - miniHeight - 10;

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

    var chart = d3.select(options.container)
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

    var cursorGroup = main.append("g")
            .style("opacity", 0)
            .style("pointer-events", "none");

    var cursor = cursorGroup.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", y1(-0.1))
            .attr("stroke", "blue");

    var cursorText = cursorGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("dy", "-.5ex")
            .text("asdfasdf")
            .style("text-anchor", "middle")
            .style("font", "9px sans-serif");

    var mini = chart.append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + (mainHeight + margin.top) + ")")
            .attr("width", width)
            .attr("height", mainHeight)
            .attr("class", "mini");

    var miniGroups = mini.append("g");

    // performance hack: performance in Firefox as of 39.0 is poor due to some
    // d3 bugs
    // Limit the initial selection to ~1/6th of the total to make things
    // bearable (user can still increase as desired)
    var start = timeExtents[0];
    var end = timeExtents[1];
    var reducedEnd = new Date(start.getTime() + ((end - start) / 8));

    var brush = d3.svg.brush()
            .x(x)
            .extent([start, reducedEnd]);

    chart.on("mouseout", function() {
        cursorGroup.style("opacity", 0);
    });

    chart.on("mousemove", function() {
        var pos = d3.mouse(this);
        var px = pos[0];
        var py = pos[1];

        if (px >= margin.left && px < (width + margin.left)
                && py > margin.top && py < (mainHeight + margin.top)) {
            var relX = px - margin.left;

            var currentTime = new Date(x1.invert(relX));

            cursorGroup.style("opacity", "0.5");
            cursorGroup.attr("transform", "translate(" + relX + ", 0)");

            cursorText.text(d3.time.format("%X")(currentTime));
        }
    });

    function updateLanes() {
        var lines = laneLines.selectAll(".laneLine")
                .data(data, function(d) { return d.key; });

        lines.enter().append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("stroke", "lightgray")
                .attr("class", "laneLine");

        lines.attr("y1", function(d, i) { return y1(i - 0.1); })
                .attr("y2", function(d, i) { return y1(i - 0.1); });

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

        cursor.attr("y2", y1(data.length - 0.1));
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
                .attr("fill", function(d) { return statusColorMap[d.status]; })
                .on("mouseover", options.onMouseover)
                .on("mouseout", options.onMouseout)
                .on("click", options.onClick);

        rects.exit().remove();
        groups.exit().remove();
    }

    function updateMiniItems() {
        var groups = miniGroups.selectAll("g")
                .data(data, function(d) { return d.key; });

        groups.enter().append("g");

        var rects = groups.selectAll("rect").data(
                function(d) { return d.values; },
                function(d) { return d.name; });

        rects.enter().append("rect")
                .attr("x", function(d) { return x(d.start_date); })
                .attr("y", function(d) { return y2(parseWorker(d.tags) + 0.5) - 5; })
                .attr("width", function(d) { return x(d.end_date) - x(d.start_date); })
                .attr("height", 10);

        rects.exit().remove();
        groups.exit().remove();
    }

    function update() {
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
            .attr("height", miniHeight - 1)
            .attr("fill", "dodgerblue")
            .attr("fill-opacity", 0.365);

    updateMiniItems();
    update();
};

function loadTimeline(path, options) { // eslint-disable-line no-unused-vars
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

        data = data.filter(function (d) { return d.duration > 0; });

        var nested = d3.nest()
                .key(function(d) { return parseWorker(d.tags); })
                .sortKeys(d3.ascending)
                .entries(data);

        window.nested = nested;

        initTimeline(options, nested, [ minStart, maxEnd ]);
    });
}
