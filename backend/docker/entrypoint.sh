#!/bin/sh
set -e

export DB_HOST="${DB_HOST:-${database_default_hostname:-127.0.0.1}}"
export DB_PORT="${DB_PORT:-${database_default_port:-3306}}"

echo "Menunggu database ${DB_HOST}:${DB_PORT} siap ..."

until php -r '
    mysqli_report(MYSQLI_REPORT_OFF);
    $db = @new mysqli(
        getenv("DB_HOST"),
        (string) getenv("database_default_username"),
        (string) getenv("database_default_password"),
        "",
        (int) getenv("DB_PORT")
    );
    exit($db->connect_errno ? 1 : 0);
' > /dev/null 2>&1; do
    sleep 2
done

echo "Database siap."

mkdir -p writable/uploads writable/cache writable/logs writable/session writable/debugbar
chown -R www-data:www-data writable

if [ "${MIGRATE_ON_START:-false}" = "true" ]; then
    echo "Menjalankan migrasi database ..."
    php spark migrate || echo "Migrasi gagal, melanjutkan memulai server."
fi

exec "$@"
