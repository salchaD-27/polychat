#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to kill all background processes on Ctrl+C or error
cleanup() {
  echo -e "\nStopping all services..."
  pkill -P $$   # Kill all child processes of this script
  exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Clean up any processes that may be running from previous session
echo "Killing any lingering services on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "Killing frontend (port 3000+) if needed..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

# frontend (runs in background)
echo "Starting frontend..."
(cd "$SCRIPT_DIR/frontend/polychat/src/app" && yarn run dev &)

# backend (runs in background)
echo "Starting backend..."
(cd "$SCRIPT_DIR/backend/src" && node index.js &)

# Rust ws server (start FIRST, blocking until ready)
echo "Starting rust-ws-server..."
(cd "$SCRIPT_DIR/rust-ws-server" && cargo run &)&
RUST_PID=$!

# Wait for Rust server to be ready (port 8080 open)
echo "Waiting for rust-ws-server to be ready..."
while ! nc -z localhost 8080; do
  sleep 0.5
done
echo "Rust server is up."

# Go service (after Rust server is confirmed running)
echo "Starting go-presence-service..."
(cd "$SCRIPT_DIR/go-presence-service" && go run main.go &)

# Wait for all background processes
wait


# & runs each component in the background.
# wait makes the script wait until all background processes finish (which is probably never if they're servers).
# Making it executable:
# chmod +x start.sh
# Run with:
# ./start.sh