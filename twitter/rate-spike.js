const request = require('request')
const moment = require('moment')
const pg = require('pg')
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const qs = require('querystring')

const consumerKey = process.env.CONSUMER_KEY
const consumerSecret = process.env.CONSUMER_SECRET

const tokenKey = process.env.TOKEN_KEY
const tokenSecret = process.env.TOKEN_SECRET

const pg_pool = new pg.Pool()

pg_pool.
  query(`
select
  ftcur.currency as short_currency,
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
    max(datetime) as datetime,
    max(high) as high
  from
    bfx.funding_trade_30m ftm
  where
    datetime >= (select max(datetime) from bfx.funding_trade_30m) - interval '1 day' and
    datetime <= (select max(datetime) from bfx.funding_trade_30m) - interval '30 minutes'
  group by
    currency) ftprev
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
      const oauth = OAuth({
        consumer: {
          key: consumerKey,
          secret: consumerSecret
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
        }
      })

      const request_data = {
        url: 'https://api.twitter.com/1.1/statuses/update.json',
        method: 'POST',
        data: {
          status: `#Bitfinex Lending Rates\n` +
            `${res.rows.map(function (i) { return `$${i['currency']}` }).join(` `)} Rate Spike (${moment().format(`YYYY-MM-DD HH:mm [Z]`)}) 📈\n` +
            res.rows.map(function (i) { return `$${i['currency']} lending rate increased from ${i['prev_high']}%/day to ${i['cur_high']}%/day` }).join(`\n`) +
            `\n\n` +
            `View Lending Rates:\n` +
            res.rows.map(function (i) { return `https://trading.bitfinex.com/f/${i['short_currency']}?demo=true` }).join(`\n`)
        },
      }

      const token = {
        key: tokenKey,
        secret: tokenSecret,
      }

      const auth = oauth.authorize(request_data, token);

      request(
        {
          url: request_data.url,
          method: request_data.method,
          headers: {
            'Authorization': 'OAuth ' + qs.stringify(auth, ',', '=')
          },
          form: request_data.data
        },
        function (error, response, body) {
          if (error) {
            console.log(error)
          }
        }
      )
    }
    pg_pool.end()
  }).
  catch(err => {
    console.error(err)
    pg_pool.end()
  })
