var chartWidth  = 600;
var chartHeight = 250;

var hist = function(data_in, chart_id, value, chart_title, minWidth, minHeight) {
    var fullWidth = (minWidth === undefined || minWidth < chartWidth) ? chartWidth : minWidth;
    var fullHeight = (minHeight === undefined) ? chartHeight : minHeight;
    var margin = {
        "top": 30,
        "right": 30,
        "bottom": 50,
        "left": 30
    },

    width = fullWidth - margin.left - margin.right,
    height = fullHeight - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, 1])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, d3.max(data_in, function(d) {
            return d.value[value];
        })])
        .range([height, 0]);

    d3.select("#" + chart_id).remove();

    var div = d3.select("#assign2-2").append("div").attr("id", chart_id);

    div.append("h2").text(chart_title);

    var svg = div.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
        .data(data_in)
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", function(d, i) {
            return "translate(" + x(i / data_in.length) + "," + y(d.value[value]) + ")";
        });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", width / data_in.length - 1)
        .attr("height", function(d) {
            return height - y(d.value[value]);
        });

    var formatCount = d3.format(",.0f");

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", (width / data_in.length - 1) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) {
            return formatCount(d.value[value]); // There was a bug here.
        });

    var unique_names = data_in.map(function(d) {
        return d.key;
    });

    var xScale = d3.scale.ordinal().domain(unique_names).rangePoints([0, width]);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    var xTicks = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("font-size", 10)
        .attr("transform", function(d) {
            return "rotate(-50)"
        });


    var yAxis = d3.svg.axis()
        .ticks(5)
        .scale(y)
        .orient("left");

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("font-size", 10);
};

d3.json("http://tranquil-peak-82564.herokuapp.com/api/v1.0/data/baseball/limit/100",
    function(error, games_json) {
        var cf = crossfilter(games_json);

        // The datum here is purely for reference so I know what I'm working with.
        var sampleDatum = {"year": 1872, "player_id": "hastisc01", "g_all": 13, "team_id": "BL1"};

        var dim_team      = cf.dimension(function(d) { return d.team_id; });
        var dim_ngames    = cf.dimension(function(d){ return d.g_all;     });

        /* add more dimensions here */
        var dim_year      = cf.dimension(function(d) { return d.year});
        var dim_player    = cf.dimension(function(d) {return d.player_id});

        var group_team    = dim_team.group();
        /* add more groups here */
        var group_year    = dim_year.group();
        var group_player  = dim_player.group();

        // sanity check
        /*
         group_team
         .top(Infinity)
         .forEach(function(d, i) {
         console.log(JSON.stringify(d));
         });
         */


        /* ---------------------------------------------------------

         Add a third and 4th variable to this map reduction
         - the third should be the minimum year
         - the fourth should be the maximum year
         - hint: use inequalities

         */

        var reduce_init = function() {
            return {
                "count": 0,
                "total": 0,
                "min_year": 0,    // 0 min/max years mark initial value, to be replaced.
                "max_year": 0,
                "all_years": []
            };
        };

        var reduce_add = function(p, v, nf) {
            ++p.count;
            p.total += v.g_all;
            if (v.year < p.min_year || p.year == 0)
                p.min_year = v.year;

            if (v.year > p.max_year || p.year == 0)
                p.max_year = v.year;

            p.all_years.push(v.year);
            return p;
        };

        var reduce_remove = function(p, v, nf) {
            --p.count;
            p.total -= v.g_all;

            p.all_years.splice(p.all_years.indexOf(v.year), 1);

            // Only re-find the min/max if it changes.
            if (v.year == p.min_year)
                p.min_year = Math.min.apply(null, p.all_years);

            if (v.year == p.max_year)
                p.max_year = Math.max.apply(null, p.all_years);

            return p;
        };

        /* --------------------------------------------------------- */


        group_team.reduce(reduce_add, reduce_remove, reduce_init);
        /* reduce the more groups here */

        var simple_init   = function () {return {"count":0 , "total_games":0}};
        var simple_add    = function(p, v) { ++p.count; p.total_games += v.g_all; return p;};
        var simple_remove = function(p, v) { --p.count; p.total_games -= v.g_all; return p;};

        group_year.reduce(simple_add, simple_remove, simple_init);
        group_player.reduce(simple_add, simple_remove, simple_init);


        var render_plots = function(){
            // count refers to a specific key specified in reduce_init
            // and updated in reduce_add and reduce_subtract
            // Modify this for the chart to plot the specified variable on the y-axis
            hist(group_team.top(Infinity),
                "appearances_by_team",
                "count",
                "# of Appearances by Team"
            );

            /* build at least 3 more charts here */

            // It looks like filtering by the year dimension does not actually change the group_year itself
            // so we will do the filtering here manually so that our graph shrinks and grows as desired.
            var yearFiltered = _.filter(group_year.top(Infinity), function(e) {
                var range = year_range_slider.getValue();
                return (e.key >= range[0] && e.key <= range[1]);
            });
            hist(yearFiltered,
                "games_per_year",
                "total_games",
                "# of Games per Year"
            );

            hist(group_team.top(Infinity),
                "games_by_team",
                "total",
                "# of Games by Team"

            );

            // There are a lot of players, so I made an optional fullWidth param to extend it.
            hist(group_player.top(Infinity),
                "games_by_player",
                "total_games",
                "# of Games by Player",
                1000
            );

            updateSliderLabels();

        };

        // var minYear      = group_year.bottom(1); // The bottom() api seems to be missing, so I will have to hack it
        var maxYear         = group_year.all()[group_year.size() - 1].key;
        var minYear         = group_year.top(1)[0].key;

        /* ---------------------------------------------------------
         this is a slider, see the html section above
         */
        var n_games_slider = new Slider(
            "#n_games_slider", {
                "id": "n_games_slider",
                "min": 0,
                "max": 500,
                "range": true,
                "value": [0, 500]
            });

        // Documentation for sliders: https://github.com/seiyria/bootstrap-slider
        /* add at least 3 more sliders here */
        var year_range_slider = new Slider(
            "#year_range_slider", {
                "id": "year_range_slider",
                "min": minYear,
                "max": maxYear,
                "range": true,
                "value": [minYear, maxYear]
            });

        // For fun, we can allow the user to adjust the height and width of the graphs (for simplicity, this is a
        // global option)

        var heightSlider = new Slider(
            "#heightSlider", {
                "id": "heightSlider",
                "min": 100,
                "max": 300,
                "value": 250,
                "tooltip":"hide"
            });

        var widthSlider = new Slider(
            "#widthSlider", {
                "id": "widthSlier",
                "min": 400,
                "max": 6000,
                "value": 600,
                "tooltip":"hide"
            });

        // this is an event handler for a particular slider
        n_games_slider.on("slide", function(e) {
            d3.select("#n_games_slider_txt").text("min: " + e[0] + ", max: " + e[1]);

            // filter based on the UI element
            dim_ngames.filter(e);

            // re-render
            render_plots();

            /* update the other charts here
             hint: each one of your event handlers needs to update all of the charts
             */
            // render_plots() updates all of the charts.

        });


        /* add at least 3 more event handlers here */
        year_range_slider.on("slide", function(e) {
            d3.select("#year_range_slider_txt").text("min: " + e[0] + ", max: " + e[1]);
            dim_year.filter(e);
            render_plots();
        });

        heightSlider.on("slide", function(e) {
            chartHeight = e;
            render_plots();
        });

        widthSlider.on("slide", function(e) {
            chartWidth = e;
            render_plots();
        });

        var updateSliderLabels = function() {
            var nGames = n_games_slider.getValue();
            d3.select("#n_games_slider_txt").text("min: " + nGames[0] + ", max: " + nGames[1]);

            var yearRange = year_range_slider.getValue();
            d3.select("#year_range_slider_txt").text("min: " + yearRange[0] + ", max: " + yearRange[1]);

            chartHeight = heightSlider.getValue();
            d3.select("#heightSlider_txt").text(chartHeight + " px");

            chatWidth = widthSlider.getValue();
            d3.select("#widthSlider_txt").text(chatWidth + " px");
        };

        /* --------------------------------------------------------- */

        render_plots(); // this just renders the plots for the first time
    });

