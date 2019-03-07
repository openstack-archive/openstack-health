FROM n42org/tox

# Build dependencies
RUN apt-get update && apt-get install -q -y \
    git curl build-essential libssl-dev

RUN curl -sLO https://deb.nodesource.com/setup_6.x \
    && bash setup_6.x \
    && apt-get -y install nodejs git chromium-browser

RUN npm install -g eslint eslint-plugin-angular eslint-config-openstack

# Cleanup
RUN apt-get remove -q -y git curl build-essential libssl-dev rsync; \
    apt-get clean; apt-get purge -y --auto-remove
