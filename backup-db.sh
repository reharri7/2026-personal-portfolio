#!/bin/bash
# PostgreSQL Backup Script for Docker Container
# Run this script with cron: 0 2 * * * /root/2026-rhett-harrison-portfolio/backup-db.sh

# Configuration
BACKUP_DIR="/root/backups/portfolio"
CONTAINER_NAME="portfolio-postgres-prod"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="portfolio_backup_${TIMESTAMP}.sql"

# Load environment variables
if [ -f "/root/2026-rhett-harrison-portfolio/.env" ]; then
    export $(grep -v '^#' /root/2026-rhett-harrison-portfolio/.env | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup at $(date)"
docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"

    # Compress backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "Backup compressed: ${BACKUP_FILE}.gz"

    # Delete old backups
    find "$BACKUP_DIR" -name "portfolio_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "Old backups cleaned up (retention: ${RETENTION_DAYS} days)"
else
    echo "Backup failed!"
    exit 1
fi

echo "Backup process finished at $(date)"
