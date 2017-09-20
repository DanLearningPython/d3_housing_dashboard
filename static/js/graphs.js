queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);


function makeGraphs(error, recordsJson) {
	
	//Clean data
	var records = recordsJson;
	//20141013T000000
	var dateFormat = d3.time.format("%Y%m%dT%H%M%S");

	records.forEach(function(d) {
		d["date"] = dateFormat.parse(d["date"]);
		d["date"].setMinutes(0);
		d["date"].setSeconds(0);
		d["longitude"] = +d["long"];
		d["latitude"] = +d["lat"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(records);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["date"]; });
	var bedroomsDim = ndx.dimension(function(d) { return d["bedroom_segment"]; });
	var zipDim = ndx.dimension(function(d){ return d["zipcode"]; });
	var conditionDim = ndx.dimension(function(d){ return ""+d["condition"]; });

	var allDim = ndx.dimension(function(d) {return d;});

	//Group Data
	var numRecordsByDate = dateDim.group();
	var bedroomsGroup = bedroomsDim.group();
	var zipGroup = zipDim.group();
	var conditionGroup = conditionDim.group();

	var all = ndx.groupAll();


	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];


	//Charts
	var numberRecordsND = dc.numberDisplay("#number-records-nd");
	var averageSale = dc.numberDisplay("#average-sale-nd");
	var timeChart = dc.barChart("#time-chart");
	var bedroomChart = dc.rowChart("#bedroom-row-chart");
	var zipChart = dc.rowChart("#zip-row-chart");
	var conditionChart = dc.pieChart("#condition-pie-chart");

    var averageSaleGroup = ndx.groupAll().reduce(
          function (p, v) {
              ++p.n;
              p.tot += v["price"];
              return p;
          },
          function (p, v) {
              --p.n;
              p.tot -= v["price"];
              return p;
          },
          function () { return {n:0,tot:0}; }
      );

	var average = function(d) {
		return d.n ? d.tot / d.n : 0;
	};

	conditionChart
	    .width(375)
		.height(175)

		.innerRadius(10)
		.dimension(conditionDim)
		.group(conditionGroup)
		.legend(dc.legend().x(140).y(0).gap(5));

	numberRecordsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	averageSale
		.formatNumber(d3.format("$.2f"))
		.valueAccessor(average)
		.group(averageSaleGroup);

	timeChart
		.width(800)
		.height(140)
		.margins({top: 10, right: 50, bottom: 20, left: 30})
		.dimension(dateDim)
		.group(numRecordsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.yAxis().ticks(4);

	bedroomChart
		.width(375)
		.height(150)
		.dimension(bedroomsDim)
		.group(bedroomsGroup)
		.colors(['#6baed6'])
		.elasticX(true)
		.labelOffsetY(10)
		.xAxis().ticks(5);

	zipChart
    	.width(350)
		.height(385)
		.dimension(zipDim)
		.group(zipGroup)
		.ordering(function(d) { return -d.value })
		.colors(['#6baed6'])
		.elasticX(true)
		.labelOffsetY(10)
		.rowsCap(15)
		.othersGrouper(false)
		.xAxis().ticks(4);


    var map = L.map('map');

	var drawMap = function(){

	    map.setView([47.486667,-122.195278], 9);
		mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; ' + mapLink + ' Contributors',
				maxZoom: 15
			}).addTo(map);

		//HeatMap
		var geoData = [];
		_.each(allDim.top(Infinity), function (d) {
			geoData.push([d["latitude"], d["longitude"], 1]);
	      });
		var heat = L.heatLayer(geoData,{
			radius: 1,
			blur: 2,
			maxZoom: 1
		}).addTo(map);

	};

	//Draw Map
	drawMap();

	//Update the heatmap if any dc chart get filtered
	dcCharts = [timeChart, bedroomChart, zipChart, conditionChart];

	_.each(dcCharts, function (dcChart) {
		dcChart.on("filtered", function (chart, filter) {
			map.eachLayer(function (layer) {
				map.removeLayer(layer)
			}); 
			drawMap();
		});
	});

	dc.renderAll();

};