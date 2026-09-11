#!/bin/sh
set -e

# Entrypoint for UI outside Docker Compose (k8s / Railway / Fly / etc.)

# Railway injects PORT at runtime. Default 8080 so a missing PORT still matches
# common PaaS expectations (never leave nginx on baked-in WEB_PORT=4200 only).
if [ -n "${PORT}" ]; then
	export WEB_PORT="${PORT}"
else
	export PORT="${PORT:-8080}"
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

# --- Bring nginx up FIRST so Railway healthchecks can pass during JS rewrite ---
envsubst '${PORT} ${WEB_PORT}' < /etc/nginx/conf.d/prod.conf.template > /etc/nginx/nginx.conf
rm -f /etc/nginx/conf.d/default.conf

echo "nginx listen config:"
grep -n "listen" /etc/nginx/nginx.conf || true

nginx -t
# Start in background so /healthz answers while we rewrite DOCKER_* placeholders
nginx
echo "Khata UI nginx ready on 0.0.0.0:${PORT} (rewriting bundles next)"

# Use envsubst to create the actual replacements_values.sed file with values from env vars
envsubst < replacements.sed > replacements_values.sed

# Only rewrite bundles that still contain Docker placeholders
js_targets=$(grep -l 'DOCKER_' ./*.js 2>/dev/null || true)
if [ -n "$js_targets" ]; then
	# shellcheck disable=SC2086
	sed -i -f replacements_values.sed $js_targets
	echo "Bundle placeholders rewritten"
else
	echo "No DOCKER_ placeholders found in JS bundles; skipping sed"
fi

# Foreground nginx as PID 1 (stop background master first)
nginx -s quit || true
# Give the previous master a moment to release the port
sleep 1

exec "$@"
