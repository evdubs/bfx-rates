const fetch = require('node-fetch')
const pg = require('pg')

const pg_pool = new pg.Pool()

pg_pool.on("error", err => {
  console.log("error in pg_pool", err)
})

fetch(`https://api-pub.bitfinex.com/v2/conf/pub:map:currency:sym`).
  then(res => res.json()).
  then(res => res.map(function(outer) {
    outer.map(function(s) {
      pg_pool.query(`
insert into bfx.currency_symbol (
  currency,
  symbol
) values (
  $1,
  $2
) on conflict (currency) do
update set
  symbol = $2;
      `, [s[0], s[1]]).
        then(() => {}).
        catch(err => { 
          console.error(err) 
        })
    })
  }))

// ugly hack to get this program to finally terminate
setTimeout(function() {
  pg_pool.end()
}, 10000)
