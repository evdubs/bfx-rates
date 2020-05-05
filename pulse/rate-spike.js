const crypto = require('crypto')
const pg = require('pg')
const request = require('request')

const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

const pg_client = new pg.Client()

pg_client.connect().
  then(() => console.log('connected to DB')).
  catch(e => console.error('error connecting to DB', e.stack))

pg_client.
  query(`
select
	ftcur.currency,
	ftcur.datetime,
	ftcur.high * 100 as cur_high,
	ftprev.high * 100 as prev_high
from
	bfx.funding_trade_30m ftcur
join
	bfx.funding_trade_30m ftprev
on
	ftcur.currency = ftprev.currency and
	ftcur.datetime = ftprev.datetime + interval '30 minutes'
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
        title: `Margin Funding: ${res.rows.map(function(i){ return `$${i['currency']}` }).join(` `)} Rate Spike`,
        content: res.rows.map(function(i) { return `$${i['currency']} increased from ${i['prev_high']}%/day to ${i['cur_high']}%/day` }).join(`\n\n`),
        isPublic: 1, // make Pulse public
        isPin: 1, // make Pulse pinned
      }

      const rawBody = JSON.stringify(body)

      console.log(`${rawBody}`)

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

        if (body.isPublic) {
          console.log(`public post - ${err} ${data}`)
        } else {
          console.log(`private post - ${err} ${data}`)
        }
      })
    }
    pg_client.end()
  }).
  catch(err => { 
    console.error(err) 
    pg_client.end()
  })
