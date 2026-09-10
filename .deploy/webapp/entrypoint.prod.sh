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

# Avoid empty sed replacements breaking the JS bundles
export API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
export CLIENT_BASE_URL="${CLIENT_BASE_URL:-http://localhost:4200}"
export API_HOST="${API_HOST:-localhost}"
export API_PORT="${API_PORT:-3000}"

echo "Khata UI starting (PORT=${PORT} API_BASE_URL=${API_BASE_URL})"

# Use envsubst to create the actual replacements_values.sed file with values from env vars
envsubst < replacements.sed > replacements_values.sed

# Only rewrite bundles that still contain Docker placeholders (fast path for Railway healthchecks)
js_targets=$(grep -l 'DOCKER_' ./*.js 2>/dev/null || true)
if [ -n "$js_targets" ]; then
	# shellcheck disable=SC2086
	sed -i -f replacements_values.sed $js_targets
else
	echo "No DOCKER_ placeholders found in JS bundles; skipping sed"
fi

# Substitute PORT into nginx config (Railway requires listening on $PORT)
envsubst '${PORT} ${WEB_PORT}' < /etc/nginx/conf.d/prod.conf.template > /etc/nginx/nginx.conf

# Drop default site so it cannot steal the port
rm -f /etc/nginx/conf.d/default.conf

echo "nginx listen config:"
grep -n "listen" /etc/nginx/nginx.conf || true

nginx -t

echo "Khata UI nginx ready on 0.0.0.0:${PORT}"

exec "$@"
