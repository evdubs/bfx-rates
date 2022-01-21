const fetch = require('node-fetch')

exports.tickerPrices = function() {
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
