#!/usr/bin/env bash

dir=$(dirname "$0")

PGUSER="$1" PGHOST="$2" PGPASSWORD="$3" PGDATABASE="$4" PGPORT="$5" node ${dir}/server/aggregate.js
