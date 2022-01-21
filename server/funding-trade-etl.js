const BFX = require('bitfinex-api-node')
const pg = require('pg')

const bfx = new BFX({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,

  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
})

const ws = bfx.ws(2)

const pg_pool = new pg.Pool()

const currencies = [
  "ADA",
  "ALG",
  "ATO",
  "AVAX",
  "AXS",
  "BCHN",
  "BSV",
  "BTC",
  "BTG",
  "COMP",
  "DAI",
  "DOGE",
  "DOT",
  "DSH",
  "EDO",
  "EGLD",
  "EOS",
  "ETC",
  "ETH",
  "ETP",
  "EUR",
  "EUT",
  "FIL",
  "FTM",
  "FTT",
  "GBP",
  "IOT",
  "JPY",
  "LEO",
  "LINK",
  "LTC",
  "LUNA",
  "MATIC",
  "MKR",
  "NEO",
  "OMG",
  "SAN",
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
  "XTZ",
  "YFI",
  "ZEC",
  "ZRX"
]

ws.on('error', (err) => console.log(err))
ws.on('open', () => {
  console.log('open')
  currencies.forEach((item, index) => {
    console.log(`subscribe f${item}`)
    ws.subscribeTrades(`f${item}`)
  })
  ws.auth()
})

currencies.forEach((symbol, index) => {
  ws.onTrades({ symbol: `f${symbol}` }, (trades) => {
    // console.log(`${symbol} trades: ${trades}`)
    trades.forEach((trade, index) => {
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
) on conflict (sequence_id) do nothing;`, [symbol,
          trade[1],
          trade[0],
          trade[2],
          trade[3],
          trade[4]]).
        // then(r => console.log('Called insert without error')).
        catch(e => console.log(e.stack))
    })
  })
})

ws.open()
