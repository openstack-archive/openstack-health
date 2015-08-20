========
StackViz
========

A visualization utility to help analyze the performance of DevStack setup and
Tempest executions.

Installation
============
Installation of the frontend requires Node.js and Bower. On Ubuntu::

    sudo apt-get install nodejs npm nodejs-legacy
    sudo npm install -g bower

Then, install the Bower components by running, from the project directory::

    bower install

Lastly, install the project. Pip is recommended, like so::

    sudo pip install .

Usage - Server
==============
First, install the necessary dependencies with Pip::

    sudo pip install -r requirements.txt

The Django development server may then be used to view the interface. Run::

    python manage.py runserver

You can then browse to the printed URL in your browser of choice.

Usage - Static Site
===================
The server can be "snapshotted" and exported to a static HTML site using the
installed :code:`stackviz-export` utility. StackViz can then be viewed using any
web browser with no requirement of any server-side processing.

To generate, run::

    stackviz-export -r path/to/testrepository/ dest_dir

... where `dest_dir` is the path to a target directory where files should be
written. When finished, the :code:`index.html` file can be opened in a browser.
Note that the above gathers test data from a `testrepository` directory, though
direct subunit streams either from files or standard input are also supported.
For more information, see `stackviz-export --help`.

Note that some browsers enforce content origin policies that may disallow
XHRs when viewed directly from the local filesystem. To work around this, you
can use something like the Python :code:`SimpleHTTPServer`::

    python -m SimpleHTTPServer

GZipped Data
------------
As the log data can become quite large, exported files can be compressed with
GZip to significantly reduce the size of the data files. To enable, run::

    stackviz-export -r path/to/testrepository/ --gzip dest_dir

Data files will then be written in compressed form, and will be suffixed with
:code:`*.json.gz`. Note that web servers must be properly configured to serve
pre-compressed files. Notably, Python's :code:`SimpleHTTPServer` will not do
this by default. However, `Twisted <https://twistedmatrix.com/trac/>`_ can be
used as a drop-in replacement as follows::

    twistd -no web --path=.

Other web servers, such as Apache, should also serve these files correctly
without any extra configuration.

(Specifically, the response must have headers
:code:`Content-Type: application/json` and :code:`Content-Encoding: gzip`.)

DStat Data
----------
StackViz will also show charts generated from
`DStat logs <http://dag.wiee.rs/home-made/dstat/>`_, if available. Note that
console output from DStat is not sufficient - a CSV logfile must be used. Then,
provide the logfile to :code:`stackviz-export`::

    stackviz-export -r testrepository/ --dstat path/to/dstat.csv dest_dir

Log Locations
=============
Log locations are configured along with normal Django settings in
:code:`stackviz/settings.py`, or specified as command-line arguments to
:code:`stackviz-export`. Several different types of logs are rendered by
StackViz are read by default from:

* Tempest (`testr` repositories): :code:`./test_data/`
* Dstat: :code:`./dstat.log`
* DevStack: *TODO*

Testing
=======

Server (Python)
---------------
Server-side tests can be run using Tox::

    tox

A linter (flake8) will be run automatically and its output included in the
report.

Client (JavaScript)
-------------------
Client-side tests are run via `Karma <http://karma-runner.github.io/>`_.
To run, install the :code:`karma-cli` and the npm dependencies::

    npm install
    sudo npm install --global karma-cli

Then, run Karma::

    karma start --single-run

Tests will be executed using `PhantomJS <http://phantomjs.org/>`_ by default.
Similarly, `ESLint <http://eslint.org/>`_ can be used to verify formatting::

    eslint stackviz/static/
