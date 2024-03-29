var pg = require('pg')

const pg_pool = new pg.Pool()

pg_pool.connect().
  catch(e => console.error('error connecting to DB', e.stack))

pg_pool.query(`
insert into
  bfx.funding_trade_30m
select
  currency,
  date_trunc('hour', datetime) + 
    (((date_part('minute', datetime)::integer / 30) * 30)
      || ' minutes')::interval as Date,
  max(rate),
  trunc(avg(rate * amount) / avg(amount), 8),
  min(rate),
  sum(amount)
from
  bfx.funding_trade
where
  datetime < date_trunc('hour', current_timestamp) + 
    (((date_part('minute', current_timestamp)::integer / 30) * 30)
      || ' minutes')::interval and
  datetime >= date_trunc('hour', current_timestamp - interval '2 hours') + 
    (((date_part('minute', current_timestamp - interval '2 hours')::integer / 30) * 30)
      || ' minutes')::interval
group by
  currency, 
  Date
on conflict (currency, datetime) do nothing;
`).catch(err => { console.error(err.stack) }).
  then(() => { process.exit() })
