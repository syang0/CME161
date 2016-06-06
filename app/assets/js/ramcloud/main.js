// Author: Stephen Yang (syang0)

var HEIGHT = 500,
    WIDTH = 500;
// Here we draw numSlots place holders for servers around a circle.


var MSG_DURATION = 1000;
var SERVER_UP_DURATION = 100;
var SIMTIME_US_TO_REALTIME_MS = 5;

var STATUS_TO_ATTR = {
    "empty": {
        "fill":"LightGray",
        "stroke":"none",
        "label":""
    },
    "client": {
        "fill":"GreenYellow",
        "stroke":"none",
        "label":"Cl"
    },
    "server": {
        "fill":"DeepSkyBlue",
        "stroke":"none",
        "label":"S"
    },
    "coordinator": {
        "fill":"DarkOrange",
        "stroke":"none",
        "label":"Co"
    }
};

var MSG_TYPE_TO_COLOR = {
    "ping":"Yellow",
    "WRITE":"Red",
    "BACKUP_WRITE": "Maroon",
    "READ":"GreenYellow",
    "GET_TABLE_CONFIG":"Magenta",
    "SERVER_CONTROL":"Pink",
    "CREATE_TABLE":"Mediumblue",
    "TAKE_TABLET_OWNERSHIP":"Midnightblue",
    "READ_HASHES":"Darkturquoise",
    "LOOKUP_INDEX_KEYS":"Greenyellow"
};


var View = function(divId) {
    var SERVER_RADIUS = 25;
    var RPC_RADIUS = 10;
    var MAX_RPC_DELAY = 1000;

    this.originX = WIDTH / 2;
    this.originY = HEIGHT / 2;
    this.RADIUS = 200;
    this.NUM_SLOTS = 10;
    this.slots = [];
    this.msgs = [];

    //
    // Read the svg for drawing
    //
    this.svg = d3.select("#"+divId)
        .append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT);

    //
    // Ready our tooltip (for mouse hovering)
    //
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    this.tooltip = tooltip;

    //
    // Draw the servers
    //
    for (var i = 0; i < this.NUM_SLOTS; ++i) {
        var deg = (2 * Math.PI / this.NUM_SLOTS) * i;
        var x = this.originX + Math.sin(deg) * this.RADIUS,
            y = this.originY + Math.cos(deg) * this.RADIUS;
        this.slots.push({status: "empty", "idx": i, "x": x, "y": y});
    }

    var serverEnter = this.svg.selectAll(".server")
        .data(this.slots)
        .enter()
        .append("g")
        .attr("class", "server")
        .attr("transform", function (d, i) {
            return "translate(" + d.x + "," + d.y + ")"
        })
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Server: " + d.id + "<br>" + "Type: " + d.status)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    serverEnter
        .append("circle")
        .attr("r", SERVER_RADIUS)
        .style("fill", function (d) {
            return STATUS_TO_ATTR[d.status].fill
        })
        .style("stroke", function (d) {
            return STATUS_TO_ATTR[d.status].stroke
        });

    serverEnter
        .append("text")
        .style("stroke", "black")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(function (d) {
            return STATUS_TO_ATTR[d.status].label
        });

    //
    // Draw the list of rpcs
    //
    this.loadMsgs = function(msgs) {
        this.msgs = msgs;
        var rpcRowsEnter = d3.select("#rpc_list_div")
            .style({
                "height": HEIGHT*2/3 + "px",
                "width": "auto",
                "overflow": "auto"
            })
            .append("tbody")
            // .style({
            //     "height": HEIGHT / 2 + "px",
            //     "position": "absolute"
            // })
            .selectAll("tr")
            .data(msgs)
            .enter();

        rpcRowsEnter
            .append("tr")
            .attr("id", function (d, i) {
                return "rpc_" + i
            })
            .append("td")
            .text(function (d) {
                if (d.type == "req") {
                    return d.from + " => " + d.to + " " + d.opcode;
                } else {
                    return d.to + " <= " + d.from + " " + d.opcode;
                }
            })
            .style("background-color", function (d) {
                return MSG_TYPE_TO_COLOR[d.opcode]
            })
            .on("mouseover", function(d, i) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("MessageId: " + i +
                             "<br>Propagation: " + d.duration + "µs" +
                             "<br>Size: " + d.size + " bytes" +
                             "<br>Type: " + d.type +
                             "<br>End To End: " + d.endToEnd + "µs" +
                             "<br>Corresponding: " + d.correspondingRpc)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on('click', function (d, i) {

            });

        this.updateProgressBar(0, 0);
    };

    this.updateProgressBar = function (currMsgNum, duration) {
        var elapsedTime = this.msgs[currMsgNum].relStart - this.msgs[0].relStart;

        var msgLength = this.msgs.length;
        var nextTime = elapsedTime;
        if (currMsgNum < msgLength - 1)
            nextTime = this.msgs[currMsgNum + 1].relStart - this.msgs[0].relStart;

        var progressString = function(elapsedTime) {
            var str = "Progress: "+currMsgNum+"/" + msgLength + "<br>Elapsed Replay Time: "+elapsedTime+"µs";
            return str;
        };

        // Animate simulated time
        d3.select("#rpcProgress")
            .html(progressString(elapsedTime))
            .transition()
            .ease("linear")
            .duration(duration)
            .tween("html", function() {
                var interp = d3.interpolateNumber(elapsedTime, nextTime);

                return function(i) {
                    this.innerHTML = progressString(Math.round(interp(i)))
                }
            })
    };

    // Internal function, send message between circle a and circle b
    this.sendMsgInternal = function(a, b, type, duration) {
        this.svg
            .insert("circle", ".server")
            .attr("class", "msg")
            .attr("cx", a.x)
            .attr("cy", a.y)
            .attr("r", RPC_RADIUS)
            .style("fill", MSG_TYPE_TO_COLOR[type])
            .style("stroke", "black")
            .transition()
            .duration(duration)
            .attr("cx", b.x)
            .attr("cy", b.y)
            .remove();
    };

    this.sendMsg = function(fromMachine, toMachine, type, duration) {
        var fromSlot = this.slots[fromMachine%this.NUM_SLOTS];
        var toSlot = this.slots[toMachine%this.NUM_SLOTS];

        this.sendMsgInternal(fromSlot, toSlot, type, duration);
    };

    this.startMachines = function (machines) {
        for (i in machines) {
            var machine = machines[i];
            this.serverUp(machine["id"]%this.NUM_SLOTS, machine["type"], machine["id"])
        }
    };

    this.serverUp = function(slot, type, id) {
        this.slots[slot].status = type;
        this.slots[slot].id = id;

        var serverUpdate = this.svg.selectAll(".server")
            .data(this.slots)
            .transition()
            .duration(SERVER_UP_DURATION);

        serverUpdate
            .selectAll("circle")
            .style("fill",  function(d) { return STATUS_TO_ATTR[d.status].fill})
            .style("stroke",  function(d) { return STATUS_TO_ATTR[d.status].stroke});

        serverUpdate
            .selectAll("text")
            .text(function(d) { return STATUS_TO_ATTR[d.status].label})
    }

    // Index is 0-based and corresponds to the messages loaded in loadMsgs
    this.highlightMessageAt = function(index, progressUpdateDuration, timeUpdateDuration) {

        var container = $('#rpc_list_div'),
            scrollTo = $('#rpc_'+index);

        var delay = Math.min(MAX_RPC_DELAY, progressUpdateDuration);
        this.updateProgressBar(index, timeUpdateDuration);
        container.finish();
        container.animate({
            scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
        }, delay);
    }

    // Finishes off any potential animations that are still going on.
    this.finish = function () {
        $('#rpc_list_div').finish();
        d3.select("#rpcProgress").transition();
    }
};

var Simulation = function(msgs, machines, view) {
    var lastMsg = msgs[msgs.length - 1];

    this.simTime = msgs[0].relStart; // in µs
    this.lastTime = lastMsg.relStart + lastMsg.duration;
    this.currIndex = 0;
    this.msgs = msgs;

    this.shouldStop = false;

    // Setting minimizeDelay means that it'll fire off events as soon as either
    // an animation ends or a new one begins before the previous end. In other words
    // it eliminates the gap intra-rpcs.
    this.minimizeDelay = true;

    // Start up the view
    view.startMachines(machines);
    view.loadMsgs(msgs);

    this.start = function() {
        this.shouldStop = false;
        this.continue();
    };

    this.stop = function () {
        this.shouldStop = true;
        view.finish()
    };

    this.setNoDelay = function (nodelay) {
        this.minimizeDelay = nodelay;
    };

    this.step = function() {
        this.continue(true)
    };

    this.skipTo = function(index) {
        this.currIndex = index;
        view.highlightMessageAt(this.currIndex, MSG_DURATION, MSG_DURATION);
    };

    this.jumpToFirst = function(name) {
        var firstIndex = 0;
        for (i in this.msgs) {
            var msg = this.msgs[i];
            if (msg["opcode"] == name) {
                firstIndex = i;
                break
            }
        }

        this.skipTo(firstIndex - 1);
    }

    this.reset = function () {
        this.currIndex = 0;
        this.shouldStop = true;
        view.highlightMessageAt(this.currIndex);
    };

    this.continue = function (onlyOnce) {
        if (this.shouldStop && !onlyOnce)
            return;

        if ((this.simTime >= this.lastTime || this.currIndex == msgs.length) && !onlyOnce) {
            this.shouldStop = true;
            return;
        }

        // Fire off rpc and sleep for a duration of time.
        var currMsg = msgs[this.currIndex];
        var relStart = currMsg["relStart"];
        var from = currMsg["from"];
        var to = currMsg["to"];
        var opcode = currMsg["opcode"];
        var duration = currMsg["duration"]*SIMTIME_US_TO_REALTIME_MS;

        view.sendMsg(from, to, opcode, duration);

        this.currIndex++;

        if (this.currIndex < msgs.length) {
            var timeBeforeNextEvent = (msgs[this.currIndex].relStart - relStart)*SIMTIME_US_TO_REALTIME_MS;
            var timeBeforeDurationEnd = duration;
            var delay = (this.minimizeDelay) ? Math.min(timeBeforeNextEvent, timeBeforeDurationEnd) : timeBeforeNextEvent;

            view.highlightMessageAt(this.currIndex-1, delay, timeBeforeNextEvent);

            if (!onlyOnce)
                setTimeout(this.continue.bind(this), delay)
        }
    }
};

d3.json("/ramcloudData", function(error, data) {
    if (error) return console.warn(error);

    var machines = data["machines"];
    var msgs = data["messages"];

    var firstBenchmarkIndex = 0;
    for (i in msgs) {
        var msg = msgs[i];
        if (msg["opcode"] == "CREATE_TABLE") {
            firstBenchmarkIndex = i;
            break
        }
    }

    var benchmarkMsgs = msgs.slice(firstBenchmarkIndex);
    for (i in benchmarkMsgs) {
        benchmarkMsgs[i]["correspondingRpc"] -= firstBenchmarkIndex;
    }

    var view = new View("ramcloudSeverDiagram");
    var sim = new Simulation(benchmarkMsgs, machines, view);
    sim.start();

    window.sim = sim;
});




function sendMsgClick()
{
    sendMsg(slots[0], slots[slots.length/2], "ping");
}

function playPauseBtnHandler() {
    if (window.sim.shouldStop == true) {
        window.sim.start();
        $("#playPauseBtn").val("Stop");
    } else {
        window.sim.stop();
        $("#playPauseBtn").val("Play");
    }
}

function stepBtnHandler() {
    $("#playPauseBtn").val("Play");
    window.sim.stop();
    window.sim.step();
}

function resetBtnHandler() {
    $("#playPauseBtn").val("Play");
    window.sim.reset();
}

function skipBtnHandler() {
    $("#playPauseBtn").val("Play");
    window.sim.stop();
    window.sim.skipTo(0);
}

function jumpToFirst(name) {
    $("#playPauseBtn").val("Play");
    window.sim.stop();
    window.sim.jumpToFirst(name);
}

