var http = require('http')
var url = require('url')
var fs = require('fs')
var path = require('path')
var pg = require('pg')
var baseDirectory = path.normalize(`__dirname/..`)   // or whatever base directory you want

var port = 80

function serveFile(requestUrl, response) {
  try {
    console.log(requestUrl)
    var parsedUrl = url.parse(requestUrl)

    // need to use path.normalize so people can't access directories underneath baseDirectory
    var fsPath = baseDirectory + path.normalize(parsedUrl.pathname)

    var fileStream = fs.createReadStream(fsPath)
    fileStream.pipe(response)
    fileStream.on('open', function () {
      response.writeHead(200)
    })
    fileStream.on('error', function (e) {
      response.writeHead(404)     // assume the file doesn't exist
      response.end()
    })
  } catch (e) {
    response.writeHead(500)
    response.end()     // end the response so browsers don't hang
    console.log(e.stack)
  }
}

const pg_client = new pg.Client()

pg_client.connect().
  then(() => console.log('connected to DB')).
  catch(e => console.error('error connecting to DB', e.stack))

function queryTrades(symbol, period, response) {
  var min = /([0-9]+)m/
  var hour = /([0-9]+)h/
  var day = /([0-9]+)d/
  var unit = ''
  var next_unit = ''
  var duration = 0
  var table = 'funding_trade'
  var rate_ref = 'rate'

  switch (true) {
    case min.test(period):
      unit = 'minute'
      next_unit = 'hour'
      duration = min.exec(period)[1]
      if (duration == 30) {
        table = 'funding_trade_30m'
        rate_ref = 'vwar'
      }
      break
    case hour.test(period):
      unit = 'hour'
      next_unit = 'day'
      duration = hour.exec(period)[1]
      table = 'funding_trade_30m'
      rate_ref = 'vwar'
      break
    case day.test(period):
      unit = 'day'
      next_unit = 'month'
      duration = day.exec(period)[1]
      table = 'funding_trade_30m'
      rate_ref = 'vwar'
      break
    default:
      break
  }

  pg_client.query(`
select
  date_trunc($3, datetime) + 
    (((date_part($2, datetime)::integer / $4::integer) * $4::integer)
      || ' ' || $2 || 's')::interval as Date,
  trunc(avg(${rate_ref} * amount) / avg(amount), 8) * 100 as Open,
  max(${rate_ref}) * 100 as High,
  min(${rate_ref}) * 100 as Low,
  trunc(avg(${rate_ref} * amount) / avg(amount), 8) * 100 as Close,
  sum(amount) as Volume
from
  bfx.${table}
where
  currency = $1::text and
  datetime > current_timestamp - (250 * $4 || ' ' || $2 || 's')::interval
group by
  Date
order by
  Date desc;
`, [symbol, unit, next_unit, duration]).then(res => {
          response.writeHead(200)
          response.write(JSON.stringify(res.rows))
          response.end()
        }).catch(err => console.error(err.stack))
}

function queryStats(symbol, period, response) {
  var min = /([0-9]+)m/
  var hour = /([0-9]+)h/
  var day = /([0-9]+)d/
  var unit = ''
  var next_unit = ''
  var duration = 0

  switch (true) {
    case min.test(period):
      unit = 'minute'
      next_unit = 'hour'
      duration = min.exec(period)[1]
      break
    case hour.test(period):
      unit = 'hour'
      next_unit = 'day'
      duration = hour.exec(period)[1]
      break
    case day.test(period):
      unit = 'day'
      next_unit = 'month'
      duration = day.exec(period)[1]
      break
    default:
      break
  }

  pg_client.query(`
select
  date_trunc($3, datetime) + 
    (((date_part($2, datetime)::integer / $4::integer) * $4::integer)
      || ' ' || $2 || 's')::interval as Date,
  trunc(avg(frr * amount_used) / avg(amount_used), 8) as Open,
  max(frr) as High,
  min(frr) as Low,
  trunc(avg(frr * amount_used) / avg(amount_used), 8) as Close,
  sum(amount_used) as Volume
from
  bfx.funding_stat
where
  currency = $1::text and
  datetime > current_timestamp - (250 * $4 || ' ' || $2 || 's')::interval
group by
  Date
order by
  Date desc;
`, [symbol, unit, next_unit, duration]).then(res => {
          response.writeHead(200)
          response.write(JSON.stringify(res.rows))
          response.end()
        }).catch(err => console.error(err.stack))
}

http.createServer(function (request, response) {
  var requestBasename = path.basename(request.url)

  switch (true) {
    case /^$/.test(requestBasename):
      serveFile('/client/html/index.html', response)
      break
    case /\.js$/.test(requestBasename):
      serveFile(`/client/js/${requestBasename}`, response)
      break
    case /\.trade.json$/.test(requestBasename):
      queryTrades(requestBasename.split(".")[0], requestBasename.split(".")[1], response)
      break
    case /\.stat.json$/.test(requestBasename):
      queryStats(requestBasename.split(".")[0], requestBasename.split(".")[1], response)
      break
    case /\.html/.test(requestBasename):
      serveFile(`/client/html/${requestBasename}`, response)
      break
    default:
      console.log(`requesting ${request.url}`)
      break
  }
}).listen(port)

console.log("listening on port " + port)
