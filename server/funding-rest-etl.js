const request = require('request')
const pg = require('pg')

const pg_pool = new pg.Pool()

const currencies = [
  "ADA",
  "ALG",
  "APE",
  "APT",
  "ATO",
  "AVAX",
  "BCHN",
  "BTC",
  "COMP",
  "DAI",
  "DOGE",
  "DOT",
  "DSH",
  "EGLD",
  "EOS",
  "ETC",
  "ETH",
  "ETHW",
  "EUR",
  "FIL",
  "GBP",
  "IOT",
  "JPY",
  "LEO",
  "LINK",
  "LTC",
  "MATIC",
  "MKR",
  "NEO",
  "SHIB",
  "SOL",
  "SUSHI",
  "TRX",
  "UNI",
  "USD",
  "UST",
  "XAUT",
  "XLM",
  "XMR",
  "XRP",
  "ZEC",
  "ZRX"
]

setInterval(() => {
  // console.log("Hit an interval")

  currencies.forEach((ccy, idx) => {
    setTimeout((c) => {
      // console.log(`Do something with ${c}`)
      try {
        var funds = request.get(`https://api-pub.bitfinex.com/v2/trades/f${c}/hist?limit=1000`,
          (err, res, body) => {
            try {
              var parsedBody = JSON.parse(body)
              if (Array.isArray(parsedBody)) {
                parsedBody.forEach((row, idx) => {
                  pg_pool.query(`
insert into bfx.funding_trade (
  currency,
  datetime,
  sequence_id,
  amount,
  rate,
  period
) values (
  $1::text,
  to_timestamp($2::bigint / 1000),
  $3::bigint,
  abs($4::numeric),
  $5::numeric,
  $6::smallint
) on conflict (sequence_id) do nothing;`, [ccy,
                    row[1],
                    row[0],
                    row[2],
                    row[3],
                    row[4]]).
                    // then(r => console.log('Called insert without error')).
                    catch(e => console.log(e.stack))
                })
              }
            } catch (err) { // JSON.parse error
              console.error(err.stack)
            }
          })
      } catch (err) { // request.get error
        console.error(err.stack)
      }
    }, 1000 * 10 * idx, ccy)
  })
}, 1000 * 60 * 10)
