#!/bin/bash
#
# Health Check Cron Script
# For internal military network deployment
# Add to crontab: */5 * * * * /path/to/cron-health-check.sh
#

APP_URL="http://localhost:3000"
LOG_FILE="/var/log/tapchi-health.log"
MAX_FAILURES=3
FAILURE_COUNT_FILE="/tmp/tapchi-health-failures"

# Initialize failure count file if it doesn't exist
if [ ! -f "$FAILURE_COUNT_FILE" ]; then
    echo "0" > "$FAILURE_COUNT_FILE"
fi

# Read current failure count
FAILURES=$(cat "$FAILURE_COUNT_FILE")

# Perform health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" --max-time 10)

if [ "$HTTP_CODE" -eq 200 ]; then
    # Health check passed
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] HEALTHY: HTTP $HTTP_CODE" >> "$LOG_FILE"
    
    # Reset failure count
    echo "0" > "$FAILURE_COUNT_FILE"
    
    exit 0
else
    # Health check failed
    FAILURES=$((FAILURES + 1))
    echo "$FAILURES" > "$FAILURE_COUNT_FILE"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] UNHEALTHY: HTTP $HTTP_CODE (Failure $FAILURES/$MAX_FAILURES)" >> "$LOG_FILE"
    
    # If max failures reached, attempt restart
    if [ "$FAILURES" -ge "$MAX_FAILURES" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] RESTARTING: Max failures reached" >> "$LOG_FILE"
        
        # Restart application (adjust based on your deployment method)
        # Example for systemd:
        # systemctl restart tapchi
        
        # Example for PM2:
        # pm2 restart tapchi
        
        # Example for Docker:
        # docker restart tapchi-app
        
        # Reset failure count after restart
        echo "0" > "$FAILURE_COUNT_FILE"
    fi
    
    exit 1
fi
