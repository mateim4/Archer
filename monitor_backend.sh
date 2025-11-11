#!/bin/bash

# Monitor backend process and restart if it crashes
BACKEND_PID=""
LOG_FILE="backend_monitor.log"

echo "$(date): Starting backend monitor..." >> $LOG_FILE

while true; do
    # Check if backend is running
    if pgrep -f "target/debug/backend" > /dev/null; then
        CURRENT_PID=$(pgrep -f "target/debug/backend")
        if [ "$BACKEND_PID" != "$CURRENT_PID" ]; then
            echo "$(date): Backend running with PID: $CURRENT_PID" >> $LOG_FILE
            BACKEND_PID=$CURRENT_PID
        fi
    else
        echo "$(date): Backend not running, starting..." >> $LOG_FILE
        cd /mnt/Mew2/DevApps/LCMDesigner/LCMDesigner
        cargo run --bin backend >> backend.log 2>&1 &
        sleep 5
        if pgrep -f "target/debug/backend" > /dev/null; then
            BACKEND_PID=$(pgrep -f "target/debug/backend")
            echo "$(date): Backend restarted with PID: $BACKEND_PID" >> $LOG_FILE
        else
            echo "$(date): Failed to restart backend" >> $LOG_FILE
        fi
    fi
    
    # Check every 10 seconds
    sleep 10
done
