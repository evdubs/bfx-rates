const crypto = require('crypto')
const moment = require('moment')
const pg = require('pg')
const request = require('request')

const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

const pg_pool = new pg.Pool()

pg_pool.
  query(`
select
  case
    when cs.symbol is null then ftcur.currency
    else cs.symbol
  end as currency,
	ftcur.datetime,
	trunc(ftcur.high * 100, 4) as cur_high,
	trunc(ftprev.high * 100, 4) as prev_high
from
	bfx.funding_trade_30m ftcur
join
  (select
    currency,
    datetime,
    max(high) as high
  from
    bfx.funding_trade_30m ftm
  where
    datetime >= (select max(datetime) from bfx.funding_trade_30m) - interval '1 day' and
    datetime <= (select max(datetime) from bfx.funding_trade_30m) - interval '30 minutes'
  group by
    currency,
    datetime) ftprev
on
	ftcur.currency = ftprev.currency and
  ftcur.datetime = ftprev.datetime + interval '30 minutes'
left outer join
  bfx.currency_symbol cs
on
  ftcur.currency = cs.currency
where
	ftcur.datetime = (select max(datetime) from bfx.funding_trade_30m) and
	ftcur.high > 2 * ftprev.high and
  ftcur.high > 0.0002 + ftprev.high;
  `).
  then(res => {
    if (res.rows.length > 0) {
      const url = 'v2/auth/w/pulse/add'
      const nonce = (Date.now() * 1000).toString()

      const body = {
        title: `Margin Lending: ${res.rows.map(function(i){ return `$${i['currency']}` }).join(` `)} Rate Spike (${moment().format(`YYYY-MM-DD HH:mm [Z]`)})`,
        content: res.rows.map(function(i) { return `$${i['currency']} lending rate increased from ${i['prev_high']}%/day to ${i['cur_high']}%/day` }).join(`\n\n`),
        isPublic: 1, // make Pulse public
        isPin: 1, // make Pulse pinned
      }

      const rawBody = JSON.stringify(body)

      let signature = `/api/${url}${nonce}${rawBody}`
      signature = crypto.
        createHmac('sha384', apiSecret).
        update(signature).
        digest('hex')

      const options = {
        url: `https://api.bitfinex.com/${url}`,
        headers: {
          'bfx-nonce': nonce,
          'bfx-apikey': apiKey,
          'bfx-signature': signature
        },
        json: body
      }

      request.post(options, (err, response, data) => {
        if (err) {
          return console.error(err)
        }
      })
    }
    pg_pool.end()
  }).
  catch(err => { 
    console.error(err) 
    pg_pool.end()
  })
