var w = window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth;

var h = window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight;

var margin = { top: 20, right: 70, bottom: 40, left: 20 },
  trade_width = w - margin.left * 2 - margin.right * 2,
  trade_height = h / 2 - margin.top * 2 - margin.bottom * 2,
  stat_width = w - margin.left * 2 - margin.right * 2,
  stat_height = h / 2 - margin.top * 2 - margin.bottom * 2;

var tickDateTimeParser = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");

var trade_x = techan.scale.financetime()
  .range([0, trade_width]);

var trade_y = d3.scaleLinear()
  .range([trade_height, 0]);

var trade_yVolume = d3.scaleLinear()
  .range([trade_y(0), trade_y(0.3)]);

var trade_brush = d3.brushX()
  .extent([[0, 0], [trade_width, trade_height]])
  .on("end", brushed);

var trade_tick = techan.plot.tick()
  .xScale(trade_x)
  .yScale(trade_y);

var trade_close = techan.plot.close()
  .xScale(trade_x)
  .yScale(trade_y);

// FIXME: change volume to spead chart
var trade_volume = techan.plot.volume()
  .xScale(trade_x)
  .yScale(trade_yVolume);

var trade_xAxis = d3.axisBottom(trade_x);

var trade_yAxis = d3.axisRight(trade_y);

var trade_tickAnnotation = techan.plot.axisannotation()
  .axis(trade_yAxis)
  .orient('right')
  .width(65)
  .format(d3.format(',.6f'))
  .translate([trade_x(1), 0]);

var trade_timeAnnotation = techan.plot.axisannotation()
  .axis(trade_xAxis)
  .orient('bottom')
  .format(d3.timeFormat('%Y-%m-%dT%H:%M:%S.%LZ'))
  .width(165)
  .translate([0, trade_height]);

var trade_crosshair = techan.plot.crosshair()
  .xScale(trade_x)
  .yScale(trade_y)
  .xAnnotation(trade_timeAnnotation)
  .yAnnotation(trade_tickAnnotation);

var trade_svg = d3.select("body").append("svg")
  .attr("width", trade_width + margin.left + margin.right)
  .attr("height", trade_height + margin.top + margin.bottom);

var trade_focus = trade_svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

trade_focus.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", trade_y(1))
  .attr("width", trade_width)
  .attr("height", trade_y(0) - trade_y(1));

trade_focus.append("text")
  .attr("class", "title")
  .attr("x", 5)
  .text("Funding trade range of rates (blue bars), funding trade volume weighted average (purple line), and volume (bottom bars)");

trade_focus.append("g")
  .attr("class", "spread")
  .attr("clip-path", "url(#clip)");

trade_focus.append("g")
  .attr("class", "tick")
  .attr("clip-path", "url(#clip)");

trade_focus.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + trade_height + ")");

trade_focus.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + trade_width + ",0)")
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -15)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .text("Rate (%/day)");

trade_focus.append('g')
  .attr("class", "crosshair")
  .call(trade_crosshair);

trade_focus.append('g')
  .attr("class", "close");

var stat_x = techan.scale.financetime()
  .range([0, stat_width]);

var stat_y = d3.scaleLinear()
  .range([stat_height, 0]);

var stat_yVolume = d3.scaleLinear()
  .range([stat_y(0), stat_y(0.3)]);

var stat_brush = d3.brushX()
  .extent([[0, 0], [stat_width, stat_height]])
  .on("end", brushed);

var stat_tick = techan.plot.tick()
  .xScale(stat_x)
  .yScale(stat_y);

var stat_close = techan.plot.close()
  .xScale(stat_x)
  .yScale(stat_y);

// FIXME: change volume to spead chart
var stat_volume = techan.plot.volume()
  .xScale(stat_x)
  .yScale(stat_yVolume);

var stat_xAxis = d3.axisBottom(stat_x);

var stat_yAxis = d3.axisRight(stat_y);

var stat_tickAnnotation = techan.plot.axisannotation()
  .axis(stat_yAxis)
  .orient('right')
  .width(65)
  .format(d3.format(',.3f'))
  .translate([stat_x(1), 0]);

var stat_timeAnnotation = techan.plot.axisannotation()
  .axis(stat_xAxis)
  .orient('bottom')
  .format(d3.timeFormat('%Y-%m-%dT%H:%M:%S.%LZ'))
  .width(165)
  .translate([0, stat_height]);

var stat_crosshair = techan.plot.crosshair()
  .xScale(stat_x)
  .yScale(stat_y)
  .xAnnotation(stat_timeAnnotation)
  .yAnnotation(stat_tickAnnotation);

var stat_svg = d3.select("body").append("svg")
  .attr("width", stat_width + margin.left + margin.right)
  .attr("height", stat_height + margin.top + margin.bottom);

var stat_focus = stat_svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

stat_focus.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", stat_y(1))
  .attr("width", stat_width)
  .attr("height", stat_y(0) - stat_y(1));

stat_focus.append("text")
  .attr("class", "title")
  .attr("x", 5)
  .text("Flash return rate (blue bars and purple line) and margin used (bottom bars)");

stat_focus.append("g")
  .attr("class", "spread")
  .attr("clip-path", "url(#clip)");

stat_focus.append("g")
  .attr("class", "tick")
  .attr("clip-path", "url(#clip)");

stat_focus.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + stat_height + ")");

stat_focus.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + stat_width + ",0)")
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -15)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .text("Rate (%/year)");

stat_focus.append('g')
  .attr("class", "crosshair")
  .call(stat_crosshair);

stat_focus.append('g')
  .attr("class", "close");

function brushed() {
  var trade_zoomable = trade_x.zoomable();
  if (d3.event.selection !== null) trade_zoomable.domain(d3.event.selection.map(trade_zoomable.invert));

  var stat_zoomable = stat_x.zoomable();
  if (d3.event.selection !== null) stat_zoomable.domain(d3.event.selection.map(stat_zoomable.invert));

  draw();
}

function draw() {
  var trade_tickSelection = trade_focus.select("g.tick"),
    trade_data = trade_tickSelection.datum();
  trade_y.domain(techan.scale.plot.ohlc(trade_data.slice.apply(trade_data, trade_x.zoomable().domain()), trade_tick.accessor()).domain());
  trade_tickSelection.call(trade_tick);
  trade_focus.select("g.spread").call(trade_volume);
  trade_focus.select("g.close").datum(trade_data).call(trade_close);
  trade_focus.select("g.x.axis").call(trade_xAxis);
  trade_focus.select("g.y.axis").call(trade_yAxis);

  var stat_tickSelection = stat_focus.select("g.tick"),
    stat_data = stat_tickSelection.datum();
  stat_y.domain(techan.scale.plot.ohlc(stat_data.slice.apply(stat_data, stat_x.zoomable().domain()), stat_tick.accessor()).domain());
  stat_tickSelection.call(stat_tick);
  stat_focus.select("g.spread").call(stat_volume);
  stat_focus.select("g.close").datum(stat_data).call(stat_close);
  stat_focus.select("g.x.axis").call(stat_xAxis);
  stat_focus.select("g.y.axis").call(stat_yAxis);
}

function update() {
  d3.json(`${document.getElementById('ccy').value}.${document.getElementById('period').value}.trade.json`, function (error, json) {
    var accessor = trade_tick.accessor();
    trade_data = json.map(function (d, index, array) {
      return {
        date: tickDateTimeParser(d.date),
        high: +d.high,
        low: +d.low,
        spread: (d.high - d.low) / 0.0001,
        volume: +d.volume,
        open: +d.open,
        close: +d.close
      };
    });
    trade_data.sort(function (a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    trade_x.domain(trade_data.map(accessor.d));
    trade_y.domain(techan.scale.plot.ohlc(trade_data, accessor).domain());
    trade_yVolume.domain(techan.scale.plot.volume(trade_data).domain());

    trade_focus.select("g.tick").datum(trade_data);
    trade_focus.select("g.spread").datum(trade_data);

    draw();
  });

  d3.json(`${document.getElementById('ccy').value}.${document.getElementById('period').value}.stat.json`, function (error, json) {
    var accessor = stat_tick.accessor();
    stat_data = json.map(function (d, index, array) {
      return {
        date: tickDateTimeParser(d.date),
        high: +d.high,
        low: +d.low,
        spread: (d.high - d.low) / 0.0001,
        volume: +d.volume,
        open: +d.open,
        close: +d.close
      };
    });
    stat_data.sort(function (a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    stat_x.domain(stat_data.map(accessor.d));
    stat_y.domain(techan.scale.plot.ohlc(stat_data, accessor).domain());
    stat_yVolume.domain(techan.scale.plot.volume(stat_data).domain());

    stat_focus.select("g.tick").datum(stat_data);
    stat_focus.select("g.spread").datum(stat_data);

    draw();
  });
}