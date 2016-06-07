// Author: Stephen Yang (syang0)

/**
 * This Javascript file enables the visualization of RAMCloud[1] RPCs as they
 * propagate throughout the cluster. This works in conjunction with a server
 * sided python script[2] that processes RAMCloud log output and formats it
 * into a JSON file.
 *
 * For the purposes of CME161, I instrumented RAMCloud[3] and collected
 * the logs of a 10 machine run[4] which...
 *   a) Starts up 8 servers + 1 coordinator
 *   b) Creates a table and issues 10 writes followed by 20 reads
 *   c) Creates another table with an index, issues 10 writes and 10 index reads.
 *   d) Performs a global index read
 *   e) Shuts down the servers
 *
 * The code in this file then allows me to analyze what happened during that run
 * and the purpose is to find bugs and unexpected behaviors. I showed this to my
 * adviser the other day and one thing we're already surprised by is that
 * INDEX_WRITE operations can be slow not because the operation itself is slow,
 * but the servers participating in the BACK_WRITE need to contact the coordinator
 * for configuration updates.
 *
 * References
 *  [1] RAMCloud Main Project: https://github.com/PlatformLab/RAMCloud
 *  [2] RAMCloud log parser: https://github.com/syang0/CME161/blob/master/RAMCloudData/parser.py
 *  [3] RAMCloud Instrumented: https://github.com/syang0/RAMCloud/commit/d441cf44fe7e678c194bcbefd5168cde5a7274c1
 *  [4] Logs Collected: https://github.com/syang0/CME161/tree/master/RAMCloudData/logs
 */

// URL referring to the data json
var DATA_URL = "/ramcloudData";

// SVG size
var HEIGHT = 500,
    WIDTH = 500;

// Configurations for Animation delays
var MAX_MSG_SCROLL_DURATION = 1000;
var SERVER_UP_DURATION = 100;

// Parametrize how fast to play back the messages
// converts replay µs time to real ms time (factor of > 1000x).
var SIMTIME_US_TO_REALTIME_MS = 5;

// Parametrize how the machine types to attributes (for drawing the circle of servers)
var MACHINE_TYPE_TO_ATTR = {
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

//TODO(syang0) can we generate this?
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

/**
 * This simulation viewport is modeled as MVC. The M is the Simulation class and it
 * issues high level commands to the V or View class to render specific actions
 * (such as sending a message). The C is not a class, but is implemented at the bottom
 * of the file and it part mediates all the button interactions on the UI to the
 * corresponding Simulation object.
 */

/**
 * View handles drawing the 10 servers, animating the rpcs that fly between them,
 * and tracking the RPC list to the right of the screen as RPCs fly across the screen.
 *
 * Grading Note: If you notice any jitter in the visualisation, it's MOST LIKELY due
 * to the data, not the actual code itself. The reason why this occurs is because it's
 * incredibly hard to synchronize the clocks of a cluster of machines down to the
 * microsecond due to time skew and network latency, so trying to collect and correlate
 * the logs based on time will result in some jitter (which is what we do in the data
 * collection phase).
 *
 * @param divId - id of the div to attach the the View to.
 * @constructor
 */
var View = function(divId) {
    var SERVER_RADIUS = 25;
    var RPC_RADIUS = 10;
    var MAX_RPC_DELAY = 1000;

    this.originX = WIDTH / 2;
    this.originY = HEIGHT / 2;
    this.RADIUS = (HEIGHT/2)*0.85;

    // Local copy of the messages to visualize. Will be overwritten upon loadMsgs
    this.msgs = [];

    //
    // Ready the svg for drawing
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
    // Draw the servers around in a circle
    //

    // Allocate the data structure that holds up to NUM_SLOTS servers.
    // This is the data that's passed into d3 for visualization.
    this.NUM_SLOTS = 10;
    this.slots = [];


    // Calculate the x and y of the machines when arranged in a circle and
    // initialize the slots to be empty
    for (var i = 0; i < this.NUM_SLOTS; ++i) {
        var deg = (2 * Math.PI / this.NUM_SLOTS) * i;
        var x = this.originX + Math.sin(deg) * this.RADIUS,
            y = this.originY + Math.cos(deg) * this.RADIUS;
        this.slots.push({status: "empty", "idx": i, "x": x, "y": y});
    }

    // Draw the machine circles and install a mouse over event
    // for tooltips
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
            return MACHINE_TYPE_TO_ATTR[d.status].fill
        })
        .style("stroke", function (d) {
            return MACHINE_TYPE_TO_ATTR[d.status].stroke
        });

    serverEnter
        .append("text")
        .style("stroke", "black")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(function (d) {
            return MACHINE_TYPE_TO_ATTR[d.status].label
        });

    //
    // Draw the list of rpcs and install mouseovers for tooltips
    //

    /**
     * Loads the list of messages that will be used in the simulation and
     * draws the table + progress meter. When the simulation advances,
     * invoke sendMsg to animate the rpc and highlightMessageAt to update
     * the list of RPCs to track.
     *
     * @param msgs - JSON of messages to display (for format, see DATA_URL["messages"])
     */
    this.loadMsgs = function(msgs) {
        this.msgs = msgs;

        var rpcRowsEnter = d3.select("#rpc_list_div")
            .style({
                "height": HEIGHT*2/3 + "px",
                "width": "auto",
                "overflow": "auto"
            })
            .append("tbody")
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

        // Initialize progress bar to position 0
        this.updateProgressBar(0, 0);
    };

    /**
     * Animates a type RPC going between fromMachine to toMachine. The animation
     * will proceed by duration (which should be scaled to realtime ms).
     *
     * @param fromMachine - machine id as given in the "from" attribute of the JSON
     * @param toMachine - machine id as given in the "to" attribute of the JSON
     * @param opcode - opcode of the rpc as given in the "opcode" of the JSON
     * @param duration - how long to animate it (should be scaled by model)
     */
    this.sendMsg = function(fromMachine, toMachine, opcode, duration) {
        var fromSlot = this.slots[fromMachine%this.NUM_SLOTS];
        var toSlot = this.slots[toMachine%this.NUM_SLOTS];

        // Animate the propagation of the rpc
        this.svg
            .insert("circle", ".server")
            .attr("class", "msg")
            .attr("cx", fromSlot.x)
            .attr("cy", fromSlot.y)
            .attr("r", RPC_RADIUS)
            .style("fill", MSG_TYPE_TO_COLOR[opcode])
            .style("stroke", "black")
            .transition()
            .duration(duration)
            .attr("cx", toSlot.x)
            .attr("cy", toSlot.y)
            .remove();
    };

    /**
     * Starts up the machines in the circle (i.e. loads them into slots)
     *
     * @param machines - JSON of [{id:<int>, type:(coordinator|server|client)}]
     */
    this.startMachines = function (machines) {
        for (i in machines) {
            var machine = machines[i];
            var slot = machine["id"]%this.NUM_SLOTS;
            this.slots[slot].status = machine["type"];;
            this.slots[slot].id = machine["id"];

            // Update the circle of machines
            var serverUpdate = this.svg.selectAll(".server")
                .data(this.slots)
                .transition()
                .duration(SERVER_UP_DURATION);

            serverUpdate
                .selectAll("circle")
                .style("fill",  function(d) { return MACHINE_TYPE_TO_ATTR[d.status].fill})
                .style("stroke",  function(d) { return MACHINE_TYPE_TO_ATTR[d.status].stroke});

            serverUpdate
                .selectAll("text")
                .text(function(d) { return MACHINE_TYPE_TO_ATTR[d.status].label})
        }
    };

    // Index is 0-based and corresponds to the messages loaded in loadMsgs

    /**
     * Scrolls the rpc list to a specific index.
     *
     * @param index - index to scroll to
     * @param progressUpdateDuration - how long we should take to scroll
     * @param timeUpdateDuration - how long should the time animate for (should be scaled
     *                              by the model into realtime ms)
     */
    this.highlightMessageAt = function(index, progressUpdateDuration, timeUpdateDuration) {
        var container = $('#rpc_list_div'),
            scrollTo = $('#rpc_'+index);

        var delay = Math.min(MAX_RPC_DELAY, progressUpdateDuration);
        this.updateProgressBar(index, timeUpdateDuration);
        container.finish();
        container.animate({
            scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
        }, delay);
    };

    /**
     * Updates the progress bar below the RPC list to show the progress as
     * #replayed/total and the time that elapsed in the system.
     *
     * @param currMsgNum - index of the current rpcs
     * @param duration - duration to animate the time by (should be scaled
     *                      before being passed in)
     */
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

        // Animate time
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

    // Finishes off any potential animations that are still going on.
    this.finish = function () {
        $('#rpc_list_div').finish();
        d3.select("#rpcProgress").transition();
    }
};

/**
 * The simulation class is the "Model" of the MVC paradigm, it controls what the View
 * should do based on how it interprets the msgs JSON.
 *
 * @param msgs      - JSON of the messages to playback (for format, see DATA_URL["messages"])
 * @param machines  - JSON of the machines involved (for format, see DATA_URL["machines"])
 * @param view      - View that handles drawing all the animations.
 * @constructor
 */
var Simulation = function(msgs, machines, view) {
    var numMsgs = msgs.length;
    this.msgs = msgs;

    // Keeps track of which msg/rpc we're currently on in the playback
    this.currIndex = 0;

    // Hint as to whether we should continue animating or not.
    this.shouldStop = false;

    // Setting minimizeDelay means that it'll fire off events as soon as either
    // an animation ends or a new one begins before the previous end. In other words
    // it eliminates the processing time gap in the machines between rpc's.
    this.minimizeDelay = true;

    // Initialize the view
    view.startMachines(machines);
    view.loadMsgs(msgs);

    /**
     * Resets the animation to the very beginning
     */
    this.reset = function () {
        this.currIndex = 0;
        this.shouldStop = true;
        view.highlightMessageAt(this.currIndex);
    };

    /**
     * Starts/Continues the animation
     */
    this.start = function() {
        this.shouldStop = false;
        this._tick();
    };

    /**
     * Steps the animation, in other words it will advance the playback by one message
     * only and stop.
     *
     * Note that this will animate the time according to the SIMTIME_US_TO_REALTIME_MS
     * factor so don't be alarmed if you see the rpc finish but the time continue to scroll.
     * This is intentional to give the user a sense of how much time has passed before the
     * next step occurs.
     */
    this.step = function() {
        this.shouldStop = true;
        this._tick(true);
    };

    /**
     * Stops the animation
     */
    this.stop = function () {
        this.shouldStop = true;
        view.finish()
    };

    /**
     * If set to true, will exclude the processing time experienced as the servers.
     *
     * Effectively, this means that playback will be faster since the simulation
     * will fire off events as soon as it's done with the previous one instead of
     * simulating the time used for processing on the machines as well.
     *
     * @param exclude - true will exclude processing time experienced by the servers
     */
    this.setExcludeProcessingTime = function (exclude) {
        this.minimizeDelay = exclude;
    };

    /**
     * Advances the replay to the first instance of a particular opcode.
     *
     * @param opcode
     */
    this.jumpToFirst = function(opcode) {
        for (i in this.msgs) {
            var msg = this.msgs[i];
            if (msg["opcode"] == opcode) {
                this.currIndex = i - 1;
                break
            }
        }

        view.highlightMessageAt(this.currIndex, MAX_MSG_SCROLL_DURATION, MAX_MSG_SCROLL_DURATION);
    };

    /**
     * Advances the replay by one step.
     *
     * @param onlyOnce - Only once will only animate by one step and not schedule
     *                   a callback for the next
     */
    this._tick = function (onlyOnce) {
        if (!onlyOnce && (this.shouldStop || this.currIndex == msgs.length) ) {
            this.shouldStop = true;
            return;
        }

        var currMsg = msgs[this.currIndex];
        var relStart = currMsg["relStart"];
        var duration = currMsg["duration"]*SIMTIME_US_TO_REALTIME_MS;

        // Fire off the rpc animation
        view.sendMsg(currMsg["from"], currMsg["to"], currMsg["opcode"], duration);

        this.currIndex++;
        if (this.currIndex < msgs.length) {

            // Determine the next time something interesting will happen
            var timeBeforeNextEvent = (msgs[this.currIndex].relStart - relStart)*SIMTIME_US_TO_REALTIME_MS;
            var timeBeforeDurationEnd = duration;
            var delay = (this.minimizeDelay)
                                ? Math.min(timeBeforeNextEvent, timeBeforeDurationEnd)
                                    : timeBeforeNextEvent;

            // Scroll the rpc list
            view.highlightMessageAt(this.currIndex, delay, timeBeforeNextEvent);

            // If it's not a one-off, schedule the next tick
            if (!onlyOnce)
                setTimeout(this._tick.bind(this), delay)
        }
    }
};

/**
 * Entry point into the start of the simulation
 */
d3.json(DATA_URL, function(error, data) {
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

    // Loop off the beginning enlistment chunk of rpcs because it's not too interesting.
    var benchmarkMsgs = msgs.slice(firstBenchmarkIndex);
    for (i in benchmarkMsgs)
        benchmarkMsgs[i]["correspondingRpc"] -= firstBenchmarkIndex;

    var view = new View("ramcloudSeverDiagram");
    var sim = new Simulation(benchmarkMsgs, machines, view);

    sim.start();
    window.sim = sim;
});

/**
 * C of the MVC paradigm. It's just a bunch of click handlers for the buttons.
 */
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
    window.sim.step();
}

function resetBtnHandler() {
    $("#playPauseBtn").val("Play");
    window.sim.reset();
}

function jumpToFirst(name) {
    $("#playPauseBtn").val("Play");
    window.sim.stop();
    window.sim.jumpToFirst(name);
}