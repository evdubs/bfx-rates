#!/usr/bin/env bash

dir=$(dirname "$0")

CONSUMER_KEY="$1" CONSUMER_SECRET="$2" TOKEN_KEY="$3" TOKEN_SECRET="$4" PGUSER="$5" PGHOST="$6" PGPASSWORD="$7" PGDATABASE="$8" PGPORT="$9" node ${dir}/twitter/rate-spike.js
