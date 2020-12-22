========================
Team and repository tags
========================

.. image:: http://governance.openstack.org/badges/openstack-health.svg
    :target: http://governance.openstack.org/reference/tags/index.html

.. Change things from this point on

================
openstack-health
================
webclient for visualizing test results of OpenStack CI jobs.

- Source: https://opendev.org/openstack/openstack-health/
- Bugs: http://bugs.launchpad.net/openstack-health
- Blueprints: https://blueprints.launchpad.net/openstack-health

Installation
============

API
---
Make sure the python dependencies are installed preferably in a virtualenv
if doing development work::

    $ pip install -r requirements.txt

Frontend
--------
Installation of the frontend requires Node.js and Gulp.

Ubuntu::

    $ sudo apt-get install nodejs npm nodejs-legacy
    $ sudo npm -g install npm@2
    $ sudo npm -g config set prefix /usr/local
    $ sudo npm -g install npm
    $ sudo npm -g install gulp

OSX (via HomeBrew, note no sudo)::

    $ brew install nodejs
    $ npm install -g gulp


Then, install the Node modules by running, from the project directory::

    $ npm install

Usage - Development
===================

API
---
To run the REST API for development you can install the openstack_health python
package in development mode and start the API service with::

    $ python setup.py develop
    $ openstack-health-api <config_file>

or alternatively just can just run the api.py file manually. For example,
from the top of the repo you would run::

    $ python2 openstack_health/api.py <config_file>

A sample of ``<config_file>`` can be found in
``etc/openstack-health-api.conf``. This will start up a local webserver
listening on localhost. You can then send requests to the specified port on
stdout to see the response.


Frontend
--------
A development server can be run as follows::

    $ gulp dev

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

    $ uwsgi -s /tmp/uwsgi.sock --module openstack_health.api --callable app --pyargv config_file --http :5000

That will startup a uwsgi server running the rest api on port 5000.

Database Configuration
^^^^^^^^^^^^^^^^^^^^^^
Depending on how your backend subunit2sql database is configured and how you've
configured the WSGI app deployed you might want to adjust the access patterns
used for querying the database. There are 3 options related to database access.
The first is **mandatory**, `db_uri` is the sqlalchemy connection string for
connecting to the database. The second option is `pool_size` which sets the size
of the connection pool to use, the default being 20. This option is used to set
the maximum number of persistent connections allowed per process. It can be set
to 0 to indicate there is no limit and -1 is used to disable pooling (which is
normally a really bad idea). The last option is `pool_recycle` which is used to
prevent the pool from using a connection which has passed a certain age. This is
a value in seconds and it defaults to 3600 (1 hour) for more info about this
option refer to the sqlalchemy documentation:
`http://docs.sqlalchemy.org/en/latest/core/pooling.html#setting-pool-recycle <http://docs.sqlalchemy.org/en/latest/core/pooling.html#setting-pool-recycle>`_

RSS Configuration
^^^^^^^^^^^^^^^^^
There are certain API queries that return an RSS feed on the wire. As part of
the events generated on these feed there are links to pages on the JS frontend.
To generate the correct links you have to tell the api server the base url of
the frontend. This is set with the `frontend_url` option and it defaults to
'http://status.openstack.org/openstack-health' the OpenStack community instance
of OpenStack-Health.


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


.. _elastic-recheck: https://opendev.org/opendev/elastic-recheck/


Caching Configuration
^^^^^^^^^^^^^^^^^^^^^
Since the introduction of elastic recheck querying dogpile.cache has been
used to cache any request that hits elasticsearch. This is because the
query times for using elastic-recheck are quite variable and often very slow.
(at least for talking to openstack-infra's elasticsearch) To enable reasonable
interactive response times we cache the api response from requests using
elasticsearch data. Note, that this caching is enabled regardless of whether
elastic-recheck is enabled or not.

There are four configuration options available around configuring caching.
While the defaults were picked to work in most situations depending on your
specific deployment specifics there are other choices that might make more
sense.

The first is `cache_backend` which is used to set the python class for the
`dogpile.cache.api.CacheBackend`_ to use. By default this is set to
`dogpile.cache.dbm` which uses a DBM file on disk. You can effectively disable
all caching by setting this value to `dogpile.cache.null`.

.. _dogpile.cache.api.CacheBackend: http://dogpilecache.readthedocs.io/en/latest/api.html#dogpile.cache.api.CacheBackend

The second option is `cache_expiration` which is used to set the timeout value
to use for any cached responses. This is an integer for the number of seconds
to keep a response cached. By default this is set to 30mins.

The third option is `cache_file` which is used to set the file path when using
the DBM backend is used. By default this is configured to use
TEMPDIR/openstack-health.dbm

The fourth option is `cache_url` which is used to provide the url to an external
service, like memcached, for storing the cache data. This only needs to be set
if you're using a backend that requires this.

It also should be noted that when configuring caching using a non-default
backend the API server will attempt to configure refreshing the cache
asynchronously with a background thread. This makes the end user response near
instantaneous in all cases because the cache is updated in the background
instead of on an incoming request.

**Recommended Production Cache Configuration:**
The recommend way to configure your cache is to have memcached setup to use for
distributed locking and then use the default dbm file store for the actual
caching. This enables using an async worker that will update the cache in the
background ensuring that users will never receive an uncached response. To set
this up you need to have memcached installed and running, then set the
*cache_url* option set to the hostname for that server. After that the defaults
to use the *dogpile.cache.dbm* backend are sufficient, however you can change
the *cache_file* to live somewhere else. You can also set the *cache_expiration*
to be a much lower value because the async worker updates the cache in the
background, so you don't have to worry about a stale cache having a user facing
performance impact.


Frontend
--------
The production application can be build using::

    $ gulp prod

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

    $ tox -e py27

Frontend
--------

The frontend tests ``npm test`` and ``npm run unit`` use a firefox
driver and the driver requires the firefox package to be installed on
the system, you can do this by running::

    $ sudo apt-get install firefox

.. note::
    When using an operating system that is not ubuntu 16.04 the
    process.env.CHROME_BIN variable may need to be updated in
    openstack-health/test/karma.conf.js to reflect your system's firefox
    path.

    For example on SUSE Leap OS, process.env.CHROME_BIN = '/usr/bin/firefox'
    must be set.

To test javascript code, run::

    $ npm test

This will execute both unit and end-to-end tests, and will write coverage
reports to :code:`./cover`. To individually run unit tests and generate coverage
reports, run::

    $ npm run unit

Similarly, to run only end-to-end tests, run::

    $ npm run protractor

Alternatively, you can start the karma server and have it watch for changes in
your files so that unit tests are run every time they change, allowing for much
faster feedback::

    ./node_modules/karma/bin/karma start test/karma.conf.js --no-single-run
