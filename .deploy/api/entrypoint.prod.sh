#!/bin/sh
set -e

# Entrypoint for API outside Docker Compose (k8s / Railway / Fly / etc.)

# Railway (and most PaaS) inject PORT — map it to Gauzy's API_PORT.
if [ -n "${PORT}" ]; then
	export API_PORT="${PORT}"
fi
export API_PORT="${API_PORT:-3000}"

# ALWAYS bind all interfaces for the HTTP listen address.
# Do not reuse a public hostname set as API_HOST (that var is for the *web* service
# JS bundle). Listening on "xxx.up.railway.app" makes the process crash / unreachable.
export API_HOST="0.0.0.0"

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

	# Always apply DATABASE_URL components. The API image bakes DB_HOST=db (compose),
	# which would otherwise win over ${DB_HOST:-...} and break Railway (ENOTFOUND db).
	export DB_USER="${_user}"
	export DB_PASS="${_pass}"
	export DB_HOST="${_host}"
	export DB_PORT="${_port}"
	export DB_NAME="${_db}"
fi

# Railway Postgres usually requires SSL
if [ -z "${DB_SSL_MODE}" ] && [ -n "${DATABASE_URL}" ]; then
	case "${DATABASE_URL}" in
		*railway*|*rlwy*|*amazonaws*) export DB_SSL_MODE=true ;;
	esac
fi

# Fail fast with a clear message instead of Nest crash-looping every few seconds.
# Production (non-demo) refuses default/empty JWT secrets — see validate-secrets.ts.
if [ "${NODE_ENV}" = "production" ] && [ "${DEMO}" != "true" ] && [ "${ALLOW_INSECURE_JWT_SECRET}" != "true" ]; then
	_missing=""
	if [ -z "${JWT_SECRET}" ] || [ "${JWT_SECRET}" = "secretKey" ]; then
		_missing="${_missing} JWT_SECRET"
	fi
	if [ -z "${JWT_REFRESH_TOKEN_SECRET}" ] || [ "${JWT_REFRESH_TOKEN_SECRET}" = "refreshSecretKey" ]; then
		_missing="${_missing} JWT_REFRESH_TOKEN_SECRET"
	fi
	if [ -z "${JWT_VERIFICATION_TOKEN_SECRET}" ] || [ "${JWT_VERIFICATION_TOKEN_SECRET}" = "verificationSecretKey" ]; then
		_missing="${_missing} JWT_VERIFICATION_TOKEN_SECRET"
	fi
	if [ -z "${EXPRESS_SESSION_SECRET}" ] || [ "${EXPRESS_SESSION_SECRET}" = "gauzy" ]; then
		_missing="${_missing} EXPRESS_SESSION_SECRET"
	fi
	if [ -n "$_missing" ]; then
		echo "ERROR: Refusing to start — set strong secrets on the API service:$_missing" >&2
		echo "Generate with: openssl rand -hex 64" >&2
		echo "Empty/default secrets cause Railway crash loops (healthcheck fails)." >&2
		exit 1
	fi
fi

if [ -z "${DATABASE_URL}" ] && [ -z "${DB_HOST}" ]; then
	echo "WARNING: DATABASE_URL / DB_HOST not set — API will likely fail to connect to Postgres." >&2
fi

echo "Khata API starting on ${API_HOST}:${API_PORT} (DB_TYPE=${DB_TYPE} DEMO=${DEMO} DB_HOST=${DB_HOST:-unset})"

exec "$@"
