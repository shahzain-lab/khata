#!/bin/sh
set -e

# Entrypoint for API outside Docker Compose (k8s / Railway / Fly / etc.)

# Railway (and most PaaS) inject PORT — map it to Gauzy's API_PORT.
if [ -n "${PORT}" ]; then
	export API_PORT="${PORT}"
fi
export API_PORT="${API_PORT:-3000}"
# Bind all interfaces so the platform healthcheck can reach the process.
export API_HOST="${API_HOST:-0.0.0.0}"

# Prefer postgres in cloud; local Docker images may still default to sqlite.
export DB_TYPE="${DB_TYPE:-postgres}"
export DEMO="${DEMO:-false}"

# Parse DATABASE_URL (Railway Postgres) into Gauzy DB_* vars when not already set.
# Format: postgres://user:pass@host:port/dbname  or  postgresql://...
if [ -n "${DATABASE_URL}" ]; then
	# strip query string (?sslmode=...)
	_url="${DATABASE_URL%%\?*}"
	_rest="${_url#*://}"
	_userinfo="${_rest%%@*}"
	_hostportpath="${_rest#*@}"
	_user="${_userinfo%%:*}"
	_pass="${_userinfo#*:}"
	_hostport="${_hostportpath%%/*}"
	_db="${_hostportpath#*/}"
	_host="${_hostport%%:*}"
	_port="${_hostport#*:}"
	[ "${_port}" = "${_host}" ] && _port="5432"

	export DB_USER="${DB_USER:-${_user}}"
	export DB_PASS="${DB_PASS:-${_pass}}"
	export DB_HOST="${DB_HOST:-${_host}}"
	export DB_PORT="${DB_PORT:-${_port}}"
	export DB_NAME="${DB_NAME:-${_db}}"
fi

# Railway Postgres usually requires SSL
if [ -z "${DB_SSL_MODE}" ] && [ -n "${DATABASE_URL}" ]; then
	case "${DATABASE_URL}" in
		*railway*|*rlwy*|*amazonaws*) export DB_SSL_MODE=true ;;
	esac
fi

echo "Khata API starting on ${API_HOST}:${API_PORT} (DB_TYPE=${DB_TYPE} DEMO=${DEMO})"

exec "$@"
