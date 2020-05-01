const fetch = require('node-fetch')

exports.tickerPrices = function() {
  currencies = [
    "ALG",
    "ATO",
    "BAB",
    "BSV",
    "BTC",
    "BTG",
    "DSH",
    "EDO",
    "EOS",
    "ETC",
    "ETH",
    "ETP",
    "EUR",
    "FTT",
    "GBP",
    "IOT",
    "JPY",
    "LEO",
    "LTC",
    "NEO",
    "OMG",
    "SAN",
    "USD",
    "UST",
    "XAUT",
    "XLM",
    "XMR",
    "XRP",
    "XTZ",
    "ZEC",
    "ZRX"
  ]

  tickers = currencies.map(function(c) { 
    if (c.length == 3)
      return "t" + c + "USD"
    else
      return "t" + c + ":USD"
  })

  return fetch(`https://api-pub.bitfinex.com/v2/tickers?symbols=${tickers.join(",")}`).
    then(res => res.json()).
    then(json => json.map(function(t) {
      return [t[0].replace(/t([A-Z]+):?USD/, '$1'), (t[1] + t[3]) / 2]
    }).concat([["USD", 1.0]]))
}
