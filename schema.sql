create table bfx.funding_stat 
(
  currency text not null,
  datetime timestamptz not null,
  frr numeric not null,
  amount_lent numeric not null,
  amount_used numeric not null,
  constraint funding_stat_currency_datetime_pkey primary key (currency, datetime)
);

create table bfx.funding_trade
(
  currency text not null,
  datetime timestamptz not null,
  sequence_id bigint not null,
  amount numeric not null,
  rate numeric not null,
  period smallint not null,
  constraint funding_trade_sequence_id_pkey primary key (sequence_id)
);

create index on bfx.funding_trade (currency, datetime);

create table bfx.funding_trade_30m
(
  currency text not null,
  datetime timestamptz not null,
  high numeric not null,
  vwar numeric not null,
  low numeric not null,
  amount numeric not null,
  constraint funding_trade_30m_currency_datetime_pkey primary key (currency, datetime)
);

create table bfx.currency_symbol
(
  currency text not null,
  symbol text not null,
  constraint symbol_currency_currency_pkey primary key (currency)
);
