#!/bin/sh

wait_for() {
  until curl -sf "$1" > /dev/null; do
    echo "Waiting for $1..."
    sleep 1
  done
}

sleep 1
wait_for http://backend:4100/api/v2
wait_for http://site:80

echo "All services ready. Starting nginx..."
exec nginx -g 'daemon off;'
