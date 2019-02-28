#!/bin/sh

mkdir -p /var/run/uwsgi
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

echo "{" > /usr/share/nginx/html/config.json
echo "  \"apiRoot\": \"$API_URL\"" >> /usr/share/nginx/html/config.json
echo "}" >> /usr/share/nginx/html/config.json

nginx -g "daemon off;"
