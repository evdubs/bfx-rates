const request = require('request')
const pg = require('pg')

const pg_client = new pg.Client()

pg_client.connect().
  then(() => console.log('connected to DB')).
  catch(e => console.error('error connecting to DB', e.stack))

const currencies = ["BTC", "USD", "ETH", "XRP", "LTC", "EOS",
  "BAB", "BSV", "EUR", "ETC", "NEO", "IOT", "XMR", 
  "UST", "DSH", "OMG", "ZEC", "JPY", "BTG", "ETP", 
  "ZRX", "GBP", "EDO", "SAN"]

setInterval(() => {
  // console.log("Hit an interval")

  currencies.forEach((ccy, idx) => {
    setTimeout((c) => {
      // console.log(`Do something with ${c}`)
      var lends = request.get(`https://api.bitfinex.com/v1/lends/${c}?limit_lends=10`,
        (err, res, body) => {
          try {
            JSON.parse(body).forEach((row, idx) => {
              pg_client.query(`
insert into bfx.funding_stat (
  currency,
  datetime,
  frr,
  amount_lent,
  amount_used
) values (
  $1::text,
  to_timestamp($2::bigint),
  $3::numeric,
  $4::numeric,
  $5::numeric
) on conflict (currency, datetime) do nothing;
`, [c,
                  row["timestamp"],
                  row["rate"],
                  row["amount_lent"],
                  row["amount_used"]]).
                // then(r => console.log('Called insert without error')).
                catch(e => console.error(e.stack))
            })
          } catch (err) { // JSON.parse error
            console.error(err.stack)
          }
        })
    }, 1000 * 10 * idx, ccy)
  })
}, 1000 * 60 * 60)
