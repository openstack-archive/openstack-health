#!/usr/bin/env bash

# Replace __TOKENS__ in files with environment variables
# Use like this:
#  cat config/templates/githubsecret.yaml | config/templates/config.sh | kubectl apply -f -
sed -e 's/__ACCESS_TOKEN__/'$GITHUB_ACCESS_TOKEN'/g' \
    -e 's/__SECRET_TOKEN__/'$GITHUB_SECRET_TOKEN'/g' \
    -e 's/__GITHUBSOURCE_ROUTE_NAME__/'$GITHUBSOURCE_ROUTE_NAME'/g' \
    -e 's/__GITHUBSOURCE_ROUTE_DOMAIN__/'$GITHUBSOURCE_ROUTE_DOMAIN'/g'
