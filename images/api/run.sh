#!/bin/sh

mkdir -p /var/run/uwsgi
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

DB_URI="$DB_PROTOCOL://$DB_USERNAME:$DB_PASSWORD@$DB_HOST/$DB_NAME"
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

echo "db_uri = $DB_URI" >> /etc/openstack-health.conf

/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
