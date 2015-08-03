========
StackViz
========

A visualization utility to help analyze the performance of DevStack setup and
Tempest executions.

Installation
============
Installation of the frontend requires Node.js and Bower. On Ubuntu::

    sudo apt-get install nodejs npm
    sudo npm install -g bower

Then, install the Bower components by running, from the project directory::

    bower install

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
:code:`export_static.py` utility. StackViz can then be viewed using any web
browser with no requirement of any server-side processing.

To generate, run::

    python export_static.py dest_dir

... where `dest_dir` is the path to a target directory where files should be
written. When finished, the :code:`index.html` file can be opened in a browser.

Note that some browsers enforce content origin policies that may disallow
XHRs when viewed directly from the local filesystem. To work around this, you
can use something like the Python :code:`SimpleHTTPServer`::

    python -m SimpleHTTPServer

GZipped Data
------------
As the log data can become quite large, exported files can be compressed with
GZip to significantly reduce the size of the data files. To enable, run::

    python export_static.py --gzip dest_dir

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

Log Locations
=============
Log locations are configured along with normal Django settings in
:code:`stackviz/settings.py`. Several different types of logs are rendered by
StackViz:

* Tempest (`testr` repositories): :code:`./test_data/`,
  :code:`/opt/stack/tempest/`
* DevStack: *TODO*
* Dstat: *TODO*
