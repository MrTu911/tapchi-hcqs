#!/bin/sh
# Database restore script for Docker environment
# Usage: docker exec -it tapchi-backup /scripts/restore_db_docker.sh /backups/tapchi_backup_YYYYMMDD_HHMMSS.sql.gz

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -lh /backups/tapchi_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="postgres"
DB_NAME="${POSTGRES_DB}"
DB_USER="${POSTGRES_USER}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will REPLACE ALL DATA in database '${DB_NAME}'!"
echo "Backup file: ${BACKUP_FILE}"
echo "Press Ctrl+C to cancel, or wait 10 seconds to continue..."
sleep 10

echo "[$(date)] Starting database restore..."

# Drop and recreate database
echo "[$(date)] Dropping existing database..."
psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"

echo "[$(date)] Creating new database..."
psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
echo "[$(date)] Restoring data from backup..."
if gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}"; then
    echo "[$(date)] Restore completed successfully!"
    echo "[$(date)] You may need to restart the application container."
    exit 0
else
    echo "[$(date)] ERROR: Restore failed!"
    exit 1
fi
