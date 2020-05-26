const fetch = require('node-fetch')
const pg = require('pg')

const pg_client = new pg.Client()

pg_client.connect().
  then(() => console.log('connected to DB')).
  catch(e => console.error('error connecting to DB', e.stack))

fetch(`https://api-pub.bitfinex.com/v2/conf/pub:map:currency:sym`).
  then(res => res.json()).
  then(res => res.map(function(outer) {
    outer.map(function(s) {
      pg_client.query(`
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
  pg_client.end()
}, 10000)
