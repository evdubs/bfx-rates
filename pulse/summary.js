const crypto = require('crypto')
const pg = require('pg')
const prices = require('./get-usd-prices.js')
const request = require('request')

const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

const pg_client = new pg.Client()

prices.tickerPrices().then(tickerPrices => { 
  pg_client.connect().
    then(() => console.log('connected to DB')).
    catch(e => console.error('error connecting to DB', e.stack))

  pg_client.
    query(`
select
  case
    when cs.symbol is null then ft.currency
    else cs.symbol
  end as currency,
  sum(ft.amount * p.price)::money as amount
from
  bfx.funding_trade_30m ft
join
  (select ${tickerPrices.map(function(tp) { 
    return `'${tp[0]}' as currency, ${tp[1]} as price` 
  }).join(" union select ")}) p
on
  ft.currency = p.currency
left outer join
  bfx.currency_symbol cs
on
  ft.currency = cs.currency
where
  ft.datetime > current_timestamp - interval '1 week'
group by
  ft.currency
order by
  amount desc
limit 10;
    `).
    then(res => {
      const url = 'v2/auth/w/pulse/add'
      const nonce = (Date.now() * 1000).toString()
      const dateStr = (new Date()).toISOString().replace(/([0-9]+-[0-9]+-[0-9]+)T.*/, '$1')
      const body = {
        title: `Margin Funding: Top 10 Currencies by Volume for the Past Week (${dateStr})`,
        content: res.rows.map(function(i) { return `$${i['currency']} ${i['amount']}` }).join(`\n\n`),
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

      pg_client.end()
    }).
    catch(err => { 
      console.error(err) 
      pg_client.end()
    })
})
