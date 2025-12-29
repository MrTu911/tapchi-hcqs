#!/bin/sh
# Database backup script for Docker environment
# Runs inside the backup container

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tapchi_backup_${TIMESTAMP}.sql.gz"
DB_HOST="postgres"
DB_NAME="${POSTGRES_DB}"
DB_USER="${POSTGRES_USER}"

echo "[$(date)] Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform backup
if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
    echo "[$(date)] Backup created successfully: ${BACKUP_FILE}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup size: ${BACKUP_SIZE}"
    
    # Clean up old backups
    echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "tapchi_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
    
    # List remaining backups
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "tapchi_backup_*.sql.gz" -type f | wc -l)
    echo "[$(date)] Total backups retained: ${BACKUP_COUNT}"
    
    echo "[$(date)] Backup completed successfully!"
    exit 0
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi
