#!/usr/bin/env bash

dir=$(dirname "$0")

API_KEY="$1" API_SECRET="$2" PGUSER="$3" PGHOST="$4" PGPASSWORD="$5" PGDATABASE="$6" PGPORT="$7" node ${dir}/pulse/summary.js
