================
openstack-health
================
webclient for visualizing test results of OpenStack CI jobs.

Installation
============

API
---
Make sure the python dependencies are installed preferably in a virtualenv
if doing development work::

    pip install -r requirements.txt

Frontend
--------
Installation of the frontend requires Node.js and Gulp.

Ubuntu::

    sudo apt-get install nodejs npm nodejs-legacy
    sudo npm -g install npm@2
    sudo npm -g config set prefix /usr/local
    sudo npm -g install npm
    sudo npm -g install gulp

OSX (via HomeBrew, note no sudo)::

    brew install nodejs
    npm install -g gulp


Then, install the Node modules by running, from the project directory::

    npm install

Usage - Development
===================

API
---
To run the REST API for development you can install the openstack_health python
package in development mode and start the API service with::

    python setup.py develop
    openstack-health-api <config_file>

or alternatively just can just run the api.py file manually. For example,
from the top of the repo you would run::

    python2 openstack_health/api.py <config_file>

A sample of ``<config_file>`` can be found in
``etc/openstack-health-api.conf``. This will start up a local webserver
listening on localhost. You can then send requests to the specified port on
stdout to see the response.


Frontend
--------
A development server can be run as follows::

    gulp dev

This will open a web browser and reload code automatically as it changes on the
filesystem.

Usage - Production
==================

API
---
The rest api is a flask application so any of the methods for deploying a
flask application can be used. The standalone entrypoint used for development
isn't suitable for production because it's single threaded. You should use
a wsgi container, something like uwsgi, gunicorn, or mod_wsgi to deploy it
for real. For example, running the API with uwsgi standalone you can do
something like::

    uwsgi -s /tmp/uwsgi.sock --module openstack_health.api --callable app --pyargv config_file --http :5000

That will startup a uwsgi server running the rest api on port 5000.

Frontend
--------
The production application can be build using::

    gulp prod

The result will be written to :code:`./build` and should be appropriate for
distribution. Note that all files are not required:

- Directory structure (:code:`js/`, :code:`css/`, :code:`fonts/`,
  :code:`images/`): required.
- Static resources (:code:`fonts/`, :code:`images/`): required.
- Core files (:code:`index.html`, :code:`js/main.js`, :code:`css/main.css`):
  required unless gzipped versions are used.
- Gzipped versions of core files (:code:`*.gz`): not required, but preferred.
  Use instead of plain core files to save on disk usage and bandwidth.
- Source maps (:code:`js/main.js.map`, :code:`js/main.js.map.gz`): only required
  for debugging purposes.

Testing
=======

API
---

To test python code, run::

    tox -e py27

Frontend
--------

To test javascript code, run::

    npm test

Alternatively, you can start the karma server and have it watch for changes in
your files so that tests are run every time they change, allowing for much
faster feedback::

    ./node_modules/karma/bin/karma start test/karma.conf.js --no-single-run
