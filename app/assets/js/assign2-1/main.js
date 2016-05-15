/*

 API returns entire iris dataset
 http://tranquil-peak-82564.herokuapp.com/api/v1.0/data/iris/

 API returns n=10 entries from dataset, useful for debugging
 http://tranquil-peak-82564.herokuapp.com/api/v1.0/data/iris/limit/10/

 data is in this format
 {"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2,"species":"setosa"}

 */

// on load data {

// crossfilter

// dimensions for sepal_length, sepal_width, petal_length, petal_width, species

// unique values for species (hint: underscore.js)

// bar charts for sepal_length, sepal_width, petal_length, petal_width, species

// render

// } end load data

d3.json("http://tranquil-peak-82564.herokuapp.com/api/v1.0/data/iris/", function(remote_json){
  window.remote_json = remote_json;

  // crossfilter
  var cf            = crossfilter(remote_json);

  // dimension
  // round to the nearest .5
  var sepal_length  = cf.dimension(function(d){return Math.round(d.sepal_length * 2)/2; });
  var species       = cf.dimension(function(d){return d.species; });

  // Implement dimensions
  // Rounding is only applied to petal_length because the range of the other dimensions
  // is fairly small and hence we can display with 0.1 accuracy without it looking too weird.
  var petal_length  = cf.dimension(function(d){return Math.round(d.petal_length*2)/2; });
  var sepal_width   = cf.dimension(function(d){return d.sepal_width; });
  var petal_width   = cf.dimension(function(d){return d.petal_width; });

  // groups
  var sepal_length_sum = sepal_length.group().reduceSum(function(d){ return d.sepal_length; });
  var species_sum      = species.group().reduceCount();

  // Implement the groups
  var sepal_width_sum   = sepal_width.group().reduceSum(function (d) { return d.sepal_width });
  var petal_length_sum  = petal_length.group().reduceSum(function (d) {return d.petal_length});
  var petal_width_sum   = petal_width.group().reduceSum(function (d) { return d.petal_width});

  // This one data point is here purely as a sample so I know what I'm working with.
  var sample = {"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2,"species":"setosa"};

  // Use underscore to pluck out the unique species :)
  window.species_names = _.chain(remote_json).pluck("species").unique().value();

  // Save every graph we create.
  var chartsAndGraphs = [];

  var sepal_length_chart = dc
    .barChart("#sepal_length_chart")
    .width(250)
    .height(200)
    .dimension(sepal_length)
    .group(sepal_length_sum)
    .centerBar(true)
    .x( d3.scale.linear().domain([3,10]) )
    .xUnits(dc.units.fp.precision(.5));

  chartsAndGraphs.push(sepal_length_chart);

  var species_chart = dc
    .pieChart("#species_chart")
    .width(250)
    .height(200)
    .dimension(species)
    .group(species_sum)
    .label(function (d) {
      return d.data.key + " (" + d.value + ")";
    });

  chartsAndGraphs.push(species_chart);

  var speal_width_chart = dc
    .barChart("#speal_width_chart")
    .width(250)
    .height(200)
    .dimension(sepal_width)
    .group(sepal_width_sum)
    .centerBar(true)
    .x( d3.scale.linear().domain([1,5]) )
    .xUnits(dc.units.fp.precision(.1));

  chartsAndGraphs.push(speal_width_chart);

  var petal_length_chart = dc
    .barChart("#petal_length_chart")
    .width(250)
    .height(200)
    .dimension(petal_length)
    .group(petal_length_sum)
    .centerBar(true)
    .x( d3.scale.linear().domain([0,8]) )
    .xUnits(dc.units.fp.precision(.5));

  chartsAndGraphs.push(petal_length_chart);

  var petal_width_chart = dc
    .barChart("#petal_width_chart")
    .width(250)
    .height(200)
    .dimension(petal_width)
    .group(petal_width_sum)
    .centerBar(true)
    .x( d3.scale.linear().domain([-0.5,3]) )
    .xUnits(dc.units.fp.precision(.1));

  chartsAndGraphs.push(petal_width_chart);

  // This section implements the "reset" button to reset all the graphs. Here, I use
  // underscore.js and the chartsAndGraphs array I created above to easily do this.

  // Bind an action on filtered for each graph
  var resetButton = d3.select("#resetButton");
  resetButton.on('click', function () {
    _.each(chartsAndGraphs, function (chart){
      chart.filterAll();
      dc.redrawAll();
    });
  });

  function showHideResetButton() {
    var showButton = _.some(chartsAndGraphs, function(element) {
      return element.filters().length > 0;
    });

    resetButton.style("visibility", (showButton) ? "visible" : "hidden");
  };

  _.each(chartsAndGraphs, function(chart) {
    chart.on('filtered', showHideResetButton);
  });

  showHideResetButton();
  dc.renderAll();
});
