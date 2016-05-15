// Author: Stephen Yang (syang0)

var DataSet = function() {
    this.data = {
        "items": {
            "item": [{
                "id": "0001",
                "type": "donut",
                "name": "Cake",
                "ppu": 0.55,
                "batters": {
                    "batter": [{
                        "id": "1001",
                        "type": "Regular"
                    }, {
                        "id": "1002",
                        "type": "Chocolate"
                    }, {
                        "id": "1003",
                        "type": "Blueberry"
                    }, {
                        "id": "1004",
                        "type": "Devil's Food"
                    }]
                },
                "topping": [{
                    "id": "5001",
                    "type": "None"
                }, {
                    "id": "5002",
                    "type": "Glazed"
                }, {
                    "id": "5005",
                    "type": "Sugar"
                }, {
                    "id": "5007",
                    "type": "Powdered Sugar"
                }, {
                    "id": "5006",
                    "type": "Chocolate with Sprinkles"
                }, {
                    "id": "5003",
                    "type": "Chocolate"
                }, {
                    "id": "5004",
                    "type": "Maple"
                }]
            }, {
                "id": "0002",
                "type": "donut",
                "name": "Raised",
                "ppu": 0.55,
                "batters": {
                    "batter": [{
                        "id": "1001",
                        "type": "Regular"
                    }]
                },
                "topping": [{
                    "id": "5001",
                    "type": "None"
                }, {
                    "id": "5002",
                    "type": "Glazed"
                }, {
                    "id": "5005",
                    "type": "Sugar"
                }, {
                    "id": "5003",
                    "type": "Chocolate"
                }, {
                    "id": "5004",
                    "type": "Maple"
                }]
            },

                {
                    "id": "0003",
                    "type": "donut",
                    "name": "Old Fashioned",
                    "ppu": 0.55,
                    "batters": {
                        "batter": [{
                            "id": "1001",
                            "type": "Regular"
                        }, {
                            "id": "1002",
                            "type": "Chocolate"
                        }]
                    },
                    "topping": [{
                        "id": "5001",
                        "type": "None"
                    }, {
                        "id": "5002",
                        "type": "Glazed"
                    }, {
                        "id": "5003",
                        "type": "Chocolate"
                    }, {
                        "id": "5004",
                        "type": "Maple"
                    }]
                }, {
                    "id": "0004",
                    "type": "bar",
                    "name": "Bar",
                    "ppu": 0.75,
                    "batters": {
                        "batter": [{
                            "id": "1001",
                            "type": "Regular"
                        }, ]
                    },
                    "topping": [{
                        "id": "5003",
                        "type": "Chocolate"
                    }, {
                        "id": "5004",
                        "type": "Maple"
                    }],
                    "fillings": {
                        "filling": [{
                            "id": "7001",
                            "name": "None",
                            "addcost": 0
                        }, {
                            "id": "7002",
                            "name": "Custard",
                            "addcost": 0.25
                        }, {
                            "id": "7003",
                            "name": "Whipped Cream",
                            "addcost": 0.25
                        }]
                    }
                },

                {
                    "id": "0005",
                    "type": "twist",
                    "name": "Twist",
                    "ppu": 0.65,
                    "batters": {
                        "batter": [{
                            "id": "1001",
                            "type": "Regular"
                        }, ]
                    },
                    "topping": [{
                        "id": "5002",
                        "type": "Glazed"
                    }, {
                        "id": "5005",
                        "type": "Sugar"
                    }, ]
                },

                {
                    "id": "0006",
                    "type": "filled",
                    "name": "Filled",
                    "ppu": 0.75,
                    "batters": {
                        "batter": [{
                            "id": "1001",
                            "type": "Regular"
                        }, ]
                    },
                    "topping": [{
                        "id": "5002",
                        "type": "Glazed"
                    }, {
                        "id": "5007",
                        "type": "Powdered Sugar"
                    }, {
                        "id": "5003",
                        "type": "Chocolate"
                    }, {
                        "id": "5004",
                        "type": "Maple"
                    }],
                    "fillings": {
                        "filling": [{
                            "id": "7002",
                            "name": "Custard",
                            "addcost": 0
                        }, {
                            "id": "7003",
                            "name": "Whipped Cream",
                            "addcost": 0
                        }, {
                            "id": "7004",
                            "name": "Strawberry Jelly",
                            "addcost": 0
                        }, {
                            "id": "7005",
                            "name": "Rasberry Jelly",
                            "addcost": 0
                        }]
                    }
                }
            ]
        }
    }
};

// Configuration variables
var height = 1000;
var width = 1000;
var lPad = 50;
var rPad = 200;                 // Larger rpad is need since "Chocolate with Sprinkles" is a long name.
var animationDelayMs = 250;     // Makes it feel snappy!
var minNodeSize = 5;
var maxNodeSize = 50;

// The goal of this code is to generate a 4-level tree in the following format:
// Menu (root) --> items (name)  +--> batters (label) --> type
//                               +--> topping (label) --> topping (type)
//                               +--> fillings(label) --> fillings (name)

//////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Data Massaging ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

// To make this a little bit easier with D3, I will massage the dataset until it
// matches the tree structure with children arrays
var dataset = (new DataSet()).data.items;

// For each item, assign ["batters", "toppings"] and optionally ["fillings"] as the
// children and flatten item.batters.batter to item.batters and item.fillings.filling
// to item.fillings arrays
dataset.item.map( function (item) {
    // Every item has batters and toppings
    item.children = [{"name":"batters",  "children":item.batters.batter},
        {"name":"toppings", "children":item.topping}];

    // Some items have fillings
    if (item["fillings"])
        item.children.push({"name":"fillings", "children":item["fillings"]["filling"]});
});

// Give the root some starting attributes and its children
dataset.name = "Menu";
dataset.children = dataset.item;
dataset.x0 = height/2;  // X and Y are flipped for horizontal draw later
dataset.y0 = 0;

// Although the format now mostly matches what we had in the example, some of the children don't
// have name fields (but do have a type). Hence, I will define a nameFn here to return the correct
// name for the tree.
function nameFn(d) {
    return (d["name"]) ? d.name : d.type;
}

//////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Boiler Plate SVG /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
var svg = d3
    .select("#hierarchy")
    .append("svg")
    .attr("height", height)
    .attr("width", width)
    .append("g")
    .attr("transform", "translate("+lPad+",0)");

// Use d3 to generate tree + node + link data
var tree = d3.layout
    .tree()
    .size([height, width - rPad]);

var diagonal = d3
    .svg
    .diagonal()
    .projection(function(d) {
        return [d.y, d.x];
    });

//////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////     Update Code      /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
var drawStaticTree = false;         // Should be false for grading
var cnt = 0;

function update(parentNode) {
    var nodes = tree.nodes(dataset);
    var links = tree.links(nodes);

    var node = svg.selectAll("g.node")
        .data(nodes, function(node) {
            // Unique identifier for each node.
            return node.gfxId || (node.gfxId = ++cnt);
        });

    // Create all the new nodes that are new to the next render and put them
    // where the source (aka parent node) is.
    var nodeEnter = node
        .enter()
        .append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + parentNode.y0 + "," + parentNode.x0 + ")";
            })
        .on("click", nodeClick);

    // In each node element, create a circle and put text next to it.
    nodeEnter.append("circle")
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px")
        .attr("r", 1e-6); // It's initially tiny so we can animate it in later.

    nodeEnter.append("text")
        .attr("x", function(d) {
            return d.children || d.hiddenChildren ? 0 : 13;
        })
        .attr("dy", function (d) {
            // Put text below the inner nodes because it looks nicer
            return d.children || d.hiddenChildren ? "1.5em": ".35em";
        })
        .attr("text-anchor", function(d) {
            return d.children || d.hiddenChildren ? "middle" : "start";
        })
        .text(nameFn)
        .style("fill-opacity", 1e-6)
        .style("font", "10px sans-serif")
        .style("fill", "black")
        .style("stroke-width", ".01px");


    // Next, animate everything outwards to their real final locations and fade in text/nodes
    var nodeUpdate = node.transition()
        .duration(animationDelayMs)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", scaleNodeSize)       // Scale node size with how many subnodes it's hiding.
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px")
        .style("fill", function(d) {
            return d.hiddenChildren ? "lightsteelblue" : "#fff";
        });

    // Change the circles along the search path to red.
    nodeUpdate.select("circle")
        .filter(nodeFilter)
        .style("fill", function(d) {return d.hiddenChildren ? "red" : "#faa";});

    nodeUpdate.select("text")
        .style("fill-opacity", 1)
        .style("font", "10px sans-serif")
        .style("fill", "black")
        .style("stroke-width", ".01px");

    // For all nodes still displayed, but hidden from the model now,
    // animate them to scrunch into its parents.
    var nodeExit = node.exit().transition()
        .duration(animationDelayMs)
        .attr("transform", function(d) {
            return "translate(" + parentNode.y + "," + parentNode.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);


    var link = svg.selectAll("path.link")
        .data(links, function(d) {
            return d.target.gfxId;
        });

    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {
                x: parentNode.x0,
                y: parentNode.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .style("fill", "none")
        .style("stroke-width", "1.5px");

    var linkTransition = link
        .transition()
        .duration(animationDelayMs)
        .attr("d", diagonal);

    link.exit().transition()
        .duration(animationDelayMs)
        .attr("d", function(d) {
            var o = {
                x: parentNode.x,
                y: parentNode.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Add transitions to the links to make them fade in nicely as well.
    linkTransition.filter(linkFilter).style("stroke", "red");
    linkTransition.filter(function(d){return !linkFilter(d);}).style("stroke", "ccc");

    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

//////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Interactivity Code /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

// There are two things I'd like to make interactive.
// 1) I want the user to be able to manually update the Filter search term
// 2) Upon collapsing the tree, I'd like the node size to scale with the number
//    of subnodes it's hiding (children + great children and so on..)

// Statically compute the number of sub-children/grand children of each node.
var countSubNodes = function (node) {
    if (!node.children) {
        node.subNodes = 0;
        return 0;
    }

    var sum = 0;
    for (var i in node.children)
        sum += countSubNodes(node.children[i]) + 1;
    node.subNodes = sum;
    return sum;
};

var maxSubNodes = countSubNodes(dataset);

// Scale size by the number of hidden subNodes (children + grand children + etc)
function scaleNodeSize(node) {
    if (!node.hiddenChildren)
        return minNodeSize;

    var scale = d3.scale.linear()
        .domain([1, maxSubNodes])
        .range([minNodeSize, maxNodeSize]);

    return scale(node.subNodes);
}

// To be triggered when a user clicks on a node.
// Contains the code to hide the children of the node
function nodeClick(d) {
    if (d.children) {
        d.hiddenChildren = d.children;
        d.children = null;
    } else {
        d.children = d.hiddenChildren;
        d.hiddenChildren = null;
    }
    update(d);
}

// I added a text box to allow for dynamic filtering
var filterText = document.getElementById("filterField").value;
function nodeFilter(source) {
    if (filterText.length == 0)
        return false;

    if(nameFn(source).toLowerCase().search(filterText.toLowerCase())>=0){
        return true;
    }
    else if(source.children || source.hiddenChildren){
        var c = source.children ?
            source.children : source.hiddenChildren;
        for(var i = 0;i< c.length;i++){
            if(nodeFilter(c[i])){
                return true;
            }
        }
    }
    return false;
}

function linkFilter(d) {
    return nodeFilter(d.target);
}

// This is the code that will be attached to the textbox and button to allow it to
// dynamically update the routes.
function startFilter() {
    filterText = document.getElementById("filterField").value;
    update(dataset);
}

document.getElementById("filterField").onkeyup = startFilter;
document.getElementById("goButton").onclick = startFilter;

if (!drawStaticTree) {
    update(dataset);
}


//////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Static draw for debugging/learning ///////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
if (drawStaticTree) {
    /// Below is the code to do a static tree.
    var nodes = tree.nodes(dataset);
    var links = tree.links(nodes);

    // Now let's draw those circles and text for each node.
    var svg_nodes = svg
        .selectAll()
        .data(nodes)
        .enter();

    var svg_links = svg
        .selectAll()
        .data(links)
        .enter();

    var curves = d3
        .svg
        .diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    svg_links
        .append("path")
        .attr("d", curves)
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "1.5px");

    svg_nodes
        .append("circle")
        .attr("r", 5)
        .attr("cy", function (d) {
            return d.x;
        })
        .attr("cx", function (d) {
            return d.y;
        })
        .style("fill", "white")
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px");

    svg_nodes
        .append("text")
        .text(nameFn)
        .attr("dy", function (d) {
            return d.x + 4;
        })
        .attr("dx", function (d) {
            return d.y + (d.children ? -10 : 10)
        })
        .attr("text-anchor", function (d) {
            return d.children ? "end" : "start";
        })
        .style("font", "10px sans-serif")
        .style("stroke", "black")
        .style("stroke-width", ".01px");

}

