================
openstack-health
================
webclient for visualizing test results of OpenStack CI jobs.

- Source: http://git.openstack.org/cgit/openstack/openstack-health
- Bugs: http://bugs.launchpad.net/openstack-health
- Blueprints: https://blueprints.launchpad.net/openstack-health

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

Elastic Recheck Configuration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
There are certain API operations which will use the `elastic-recheck`_ project
to pull in additional information about failures that occur during a run.
However, since elastic-recheck is not widely deployed this is an optional
feature and is only enabled if elastic-recheck is installed. (and importable
by the API server) Also note that elastic-recheck is not published on pypi and
must be manually installed via git. Additionally, after you install
elastic-recheck you also need to configure the location of the queries by
using the `query_dir` configuration option. If this is not set than the
elastic-recheck support will be disabled. Optionally, if you need to set
the url of you elasticsearch API endpoint you can set this with the `es_url`
configuration option. By default it is configured to talk to openstack-infra's
elasticsearch server at http://logstash.openstack.org/elasticsearch


.. _elastic-recheck: http://git.openstack.org/cgit/openstack-infra/elastic-recheck/


Caching Configuration
^^^^^^^^^^^^^^^^^^^^^
Since the introduction of elastic recheck querying dogpile.cache has been
used to cache any request that hits elasticsearch. This is because the
query times for using elastic-recheck are quite variable and often very slow.
(at least for talking to openstack-infra's elasticsearch) To enable reasonable
interactive response times we cache the api response from requests using
elasticsearch data. Note, that this caching is enabled regardless of whether
elastic-recheck is enabled or not.

There are three configuration options available around configuring caching.
While the defaults were picked to work in most situations depending on your
specific deployment specifics there are other choices that might make more
sense.

The first is `cache_backend` which is used to set the python class for the
`dogpile.cache.api.CacheBackend`_ to use. By default this is set to
`dogpile.cache.dbm` which uses a DBM file on disk. You can effectively disable
all caching by setting this value to `dogpile.cache.null`.

.. __dogpile.cache.api.CacheBackend: http://dogpilecache.readthedocs.io/en/latest/api.html#dogpile.cache.api.CacheBackend

The second option is `cache_expiration` which is used to set the timeout value
to use for any cached responses. This is an integer for the number of seconds
to keep a response cached. By default this is set to 30mins.

The third option is `cache_file` which is used to set the file path when using
the DBM backend is used. By default this is configured to use
TEMPDIR/openstack-health.dbm

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

This will execute both unit and end-to-end tests, and will write coverage
reports to :code:`./cover`. To individually run unit tests and generate coverage
reports, run::

    npm run unit

Similarly, to run only end-to-end tests, run::

    npm run protractor

Alternatively, you can start the karma server and have it watch for changes in
your files so that unit tests are run every time they change, allowing for much
faster feedback::

    ./node_modules/karma/bin/karma start test/karma.conf.js --no-single-run
