FROM nginx:latest

# Build dependencies
RUN apt-get update && apt-get install -q -y \
    git curl build-essential libssl-dev rsync

RUN curl -sLO https://deb.nodesource.com/setup_6.x \
    && bash setup_6.x \
    && apt-get -y install nodejs

# Install gulp
RUN npm install -g gulp

# Install packages first
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p openstack-health/app && mv /tmp/node_modules openstack-health/app

# Install, build and deploy
COPY . openstack-health
RUN cd openstack-health; npm install; gulp prod; cd ..; \
    rsync -arPz --delete openstack-health/build/ /usr/share/nginx/html/

# Cleanup
RUN apt-get remove -q -y git curl build-essential libssl-dev rsync; \
    apt-get clean; apt-get purge -y --auto-remove

COPY images/frontend/run.sh .
CMD ./run.sh
