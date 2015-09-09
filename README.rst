=================
StackViz: Angular
=================
A temporary fork of StackViz while the conversion to Angular is in progress.
Changes here will be merged back into the main StackViz repository when things
have stabilized.

Installation
============
Installation of the frontend requires Node.js and Gulp. On Ubuntu::

    sudo apt-get install nodejs npm nodejs-legacy
    sudo npm install -g gulp

Then, install the Node modules by running, from the project directory::

    npm install

Usage - Development
===================
A development server can be run as follows::

    gulp dev

This will open a web browser and reload code automatically as it changes on the
filesystem.

Usage - Production
==================
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

Roadmap
=======
- Project split: All server-side components will be removed, and replaced with
  specialized data transformation tools.

  - Data sources and processing: moving to external project, potentially
    integrated directly with `Testr <https://wiki.openstack.org/wiki/Testr>`_
    and `subunit2sql <https://github.com/openstack-infra/subunit2sql>`_.

  - Web interface:

    - Will remain in this namespace (:code:`openstack-qa/stackviz`).
    - Will decouple data processing from build process, allowing for
      distribution to nodes as a prebuilt static site.
    - Data sources will be configured in in a :code:`config.json`.
    - Will support local and remote sources via REST/JSONP (pending API spec).

- Angular conversion: current codebase will be rewritten to use Angular.
- Python dependency removal: all Python depedencies and build requirements will
  be removed from this project.
