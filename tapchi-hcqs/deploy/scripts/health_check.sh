#!/bin/sh
# Health check script for monitoring system status

set -e

echo "=== Tạp chí Hậu cần Quân sự - System Health Check ==="
echo "Time: $(date)"
echo ""

# Check Docker containers
echo "[1] Docker Containers Status:"
docker-compose -f /home/ubuntu/tapchi-hcqs/deploy/docker-compose.yml ps
echo ""

# Check database connection
echo "[2] Database Connection:"
if docker exec tapchi-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ Database is ready"
else
    echo "✗ Database is NOT ready"
fi
echo ""

# Check application health
echo "[3] Application Health:"
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Application is responding"
else
    echo "✗ Application is NOT responding"
fi
echo ""

# Check Nginx
echo "[4] Nginx Status:"
if curl -f -s http://localhost/nginx-health > /dev/null 2>&1; then
    echo "✓ Nginx is healthy"
else
    echo "✗ Nginx is NOT healthy"
fi
echo ""

# Check disk usage
echo "[5] Disk Usage:"
df -h | grep -E '(Filesystem|/$|/var)'
echo ""

# Check recent backups
echo "[6] Recent Backups:"
ls -lht /home/ubuntu/tapchi-hcqs/deploy/backups/tapchi_backup_*.sql.gz 2>/dev/null | head -n 5 || echo "No backups found"
echo ""

# Check logs for errors
echo "[7] Recent Errors in Logs (last 10):"
docker logs tapchi-app --tail 100 2>&1 | grep -i error | tail -n 10 || echo "No recent errors"
echo ""

echo "=== Health Check Complete ==="
