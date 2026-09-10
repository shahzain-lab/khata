#!/bin/sh
set -e

# Entrypoint for UI outside Docker Compose (k8s / Railway / Fly / etc.)

# Railway injects PORT — nginx must listen on it.
if [ -n "${PORT}" ]; then
	export WEB_PORT="${PORT}"
else
	export PORT="${WEB_PORT:-4200}"
	export WEB_PORT="${PORT}"
fi

# Sensible Khata defaults (override via Railway variables)
export DEMO="${DEMO:-false}"
export COMPANY_SITE_NAME="${COMPANY_SITE_NAME:-Khata}"
export COMPANY_NAME="${COMPANY_NAME:-Khata}"
export APP_NAME="${APP_NAME:-Khata}"

# Use envsubst to create the actual replacements_values.sed file with values from env vars
envsubst < replacements.sed > replacements_values.sed

# In production we should replace some values in generated JS code
sed -i -f replacements_values.sed *.js

# Substitute PORT into nginx config (Railway requires listening on $PORT)
envsubst '${PORT} ${WEB_PORT}' < /etc/nginx/conf.d/prod.conf.template > /etc/nginx/nginx.conf

echo "Khata UI nginx listening on ${PORT} (API_BASE_URL=${API_BASE_URL})"

exec "$@"
