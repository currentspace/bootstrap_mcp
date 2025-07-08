#!/bin/bash

# PID file location
PROXY_PID_FILE="/tmp/bootstrap-mcp-proxy.pid"

# Check for proxy
if [ -f "$PROXY_PID_FILE" ]; then
    PID=$(cat "$PROXY_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Sending reload signal to Bootstrap MCP proxy (PID: $PID)..."
        kill -HUP "$PID"
        echo "Reload signal sent. Check /tmp/bootstrap-mcp-debug.log for status."
    else
        echo "Bootstrap MCP proxy not running (stale PID file)"
        rm -f "$PROXY_PID_FILE"
    fi
else
    echo "Bootstrap MCP server not running (no PID file found)"
fi