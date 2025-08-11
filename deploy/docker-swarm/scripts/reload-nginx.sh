#!/bin/bash

# Script to reload nginx configuration without restarting containers
# Usage: ./reload-nginx.sh [stack_name]

set -e

STACK_NAME=${1:-kukirin}

echo "🔄 Reloading nginx configuration for stack: $STACK_NAME"

# Find all nginx containers in the stack
CONTAINERS=$(docker ps --filter "name=${STACK_NAME}_nginx" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
    echo "❌ No nginx containers found for stack: $STACK_NAME"
    echo "Available containers:"
    docker ps --filter "name=nginx" --format "table {{.Names}}\t{{.Node}}"
    exit 1
fi

echo "📋 Found nginx containers:"
echo "$CONTAINERS"
echo ""

# Reload nginx on each container
for container in $CONTAINERS; do
    echo "🔄 Reloading nginx in container: $container"
    if docker exec "$container" nginx -s reload; then
        echo "✅ Successfully reloaded nginx in $container"
    else
        echo "❌ Failed to reload nginx in $container"
        exit 1
    fi
done

echo ""
echo "🎉 All nginx containers reloaded successfully!"
echo "📝 Configuration changes are now active." 