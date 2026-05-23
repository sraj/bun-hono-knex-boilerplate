#!/bin/sh
set -e

CLICKSTACK_HOST="${CLICKSTACK_HOST:-clickstack}"
CLICKSTACK_PORT="${CLICKSTACK_PORT:-8080}"
MONGO_HOST="${MONGO_HOST:-clickstack}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-hyperdx}"

echo "Waiting for ClickStack API at $CLICKSTACK_HOST:$CLICKSTACK_PORT..."
until curl -sf "http://$CLICKSTACK_HOST:$CLICKSTACK_PORT/" > /dev/null 2>&1; do
  sleep 2
done
echo "ClickStack API is ready"

API_BASE="http://$CLICKSTACK_HOST:$CLICKSTACK_PORT/api/v2"
AUTH_HEADER="Authorization: Bearer $HYPERDX_ACCESS_KEY"

# Get connection ObjectId from MongoDB
echo "Looking up connection 'Local ClickHouse' from MongoDB..."
CONN_ID=$(mongoexport --host "$MONGO_HOST:$MONGO_PORT" --db "$MONGO_DB" \
  --collection connections --query '{"name":"Local ClickHouse"}' 2>/dev/null | \
  jq -r '._id["$oid"] // empty')

if [ -z "$CONN_ID" ]; then
  echo "ERROR: Connection 'Local ClickHouse' not found in MongoDB"
  exit 1
fi
echo "Found connection: $CONN_ID"

# --- Step 1: Ensure "App logs" source exists ---
echo "Checking for source 'App logs'..."
SOURCE_ID=$(mongoexport --host "$MONGO_HOST:$MONGO_PORT" --db "$MONGO_DB" \
  --collection sources --query '{"name":"App logs"}' 2>/dev/null | \
  jq -r '._id["$oid"] // empty')

if [ -n "$SOURCE_ID" ]; then
  echo "Source 'App logs' already exists (id: $SOURCE_ID)"
else
  echo "Creating source 'App logs'..."
  SOURCE_PAYLOAD=$(sed "s/__CONNECTION_ID__/$CONN_ID/g" /app-logs-source.json)
  RESP=$(curl -sf -X POST "$API_BASE/sources" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$SOURCE_PAYLOAD")
  SOURCE_ID=$(echo "$RESP" | jq -r '.data.id // .id // empty')
  echo "Source 'App logs' created (id: $SOURCE_ID)"
fi

# --- Step 2: Create dashboard if not exists ---
echo "Checking for dashboard 'App Monitoring'..."
DASH_ID=$(mongoexport --host "$MONGO_HOST:$MONGO_PORT" --db "$MONGO_DB" \
  --collection dashboards --query '{"name":"App Monitoring"}' 2>/dev/null | \
  jq -r '._id["$oid"] // empty')

if [ -n "$DASH_ID" ]; then
  echo "Dashboard 'App Monitoring' already exists (id: $DASH_ID)"
else
  echo "Creating dashboard 'App Monitoring'..."
  if [ -z "$SOURCE_ID" ]; then
    echo "ERROR: Source ID is empty"
    exit 1
  fi

  DASHBOARD_PAYLOAD=$(jq --arg sid "$SOURCE_ID" \
    '.tiles[].series[].sourceId = $sid' /app-monitoring-dashboard.json)

  RESP=$(curl -sf -X POST "$API_BASE/dashboards" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$DASHBOARD_PAYLOAD")
  DASH_ID=$(echo "$RESP" | jq -r '.data.id // .id // empty')
  echo "Dashboard 'App Monitoring' created (id: $DASH_ID)"
fi

echo "Provisioning complete"
