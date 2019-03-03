FROM python:3.6-slim-stretch

# Container interface
EXPOSE 80

# Build dependencies
RUN apt-get update && apt-get install -q -y \
    build-essential musl-dev libxml2-dev git

# Required apt packages
RUN apt-get install -q -y nginx supervisor memcached default-libmysqlclient-dev
# Required pip packages
RUN pip3 install --no-cache-dir -U psycopg2 uwsgi mysqlclient

# Configuring nginx and uwsgi
RUN rm -f /etc/nginx/conf.d/default.conf; \
    ln -sf /dev/stdout /var/log/nginx/access.log; \
    ln -sf /dev/stderr /var/log/nginx/error.log; \
    echo "daemon off;" >> /etc/nginx/nginx.conf

# Install requirements first to avoid reinstalling on code changes
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt
COPY . openstack-health
RUN pip3 install --no-cache-dir -U openstack-health/.

# Cleanup
RUN apt-get remove -q -y build-essential musl-dev libxml2-dev git; \
    apt-get clean; apt-get purge -y --auto-remove

# Deploy configuration from the context
COPY images/api/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY images/api/health-api.conf /etc/nginx/conf.d/health-api.conf
COPY images/api/health-uwsgi-api.ini /etc/health-uwsgi-api.ini
COPY images/api/openstack-health.conf /etc/openstack-health.conf

# Remove any other site
RUN sed -i -e '/sites-enabled/d' /etc/nginx/nginx.conf

COPY images/api/run.sh /root/run.sh

CMD /root/run.sh
