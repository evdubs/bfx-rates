const crypto = require('crypto')
const request = require('request')
const pg = require('pg')

const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

const pg_client = new pg.Client()

pg_client.connect().
  then(() => console.log('connected to DB')).
  catch(e => console.error('error connecting to DB', e.stack))

pg_client.
  query(`
select
  currency,
  sum(amount)::money as amount
from
  bfx.funding_trade_30m
where
  datetime > current_timestamp - interval '1 week'
group by
  currency
order by
  amount desc
limit 5;
  `).
  then(res => {
    const url = 'v2/auth/w/pulse/add'
    const nonce = (Date.now() * 1000).toString()
    const body = {
      title: 'Top 5 Currencies by Funding Volume for Past Week',
      content: res.rows.map(function(i) { return `${i['currency']} ${i['amount']}` }).join(`\n\n`)
      //isPublic: 1, // make Pulse public
      //isPin: 1, // make Pulse pinned
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

      if (body.isPublic) {
        console.log(`public post - ${err} ${data}`)
      } else {
        console.log(`private post - ${err} ${data}`)
      }
    })
  }).
  catch(err => console.error(err))

