#!/bin/bash

# MCP Server Start Script with Hot Reload Support via Proxy

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Debug mode
DEBUG="${DEBUG:-true}"
LOG_FILE="/tmp/bootstrap-mcp-debug.log"
PROXY_PID_FILE="/tmp/bootstrap-mcp-proxy.pid"

# Function to log debug messages
debug_log() {
    if [ "$DEBUG" = "true" ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
    fi
}

# Function to build the project
build_project() {
    debug_log "Building project..."
    pnpm run build >> "$LOG_FILE" 2>&1
    if [ $? -eq 0 ]; then
        debug_log "Build successful"
        return 0
    else
        debug_log "Build failed"
        return 1
    fi
}

# Initial build
build_project
if [ $? -ne 0 ]; then
    echo "Initial build failed, exiting" >&2
    exit 1
fi

# Compile the proxy if needed
if [ ! -f "dist/proxy.js" ] || [ "src/proxy.ts" -nt "dist/proxy.js" ]; then
    debug_log "Compiling proxy..."
    pnpm exec esbuild src/proxy.ts --bundle --platform=node --target=node24 --outfile=dist/proxy.js
fi

# Save proxy PID
echo $$ > "$PROXY_PID_FILE"

# Run the proxy (which will manage the actual server)
# The proxy maintains stdin/stdout connection with Claude
exec node dist/proxy.js