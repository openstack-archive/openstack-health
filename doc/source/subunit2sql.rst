=================
subunit2SQL Usage
=================
openstack-health relies on `subunit2SQL`_ to process subunit streams and store
the stream’s test results in a remote repository. This document aims to outline
the desired usage of the program in order to use all of the features
openstack-health provides.

.. _subunit2SQL: https://github.com/openstack-infra/subunit2sql/blob/master/README.rst

For details on how to create a run with the ``run_meta`` argument and
additional arguments see `subunit2SQL's usage pattern`_

.. _subunit2SQL's usage pattern: https://docs.openstack.org/subunit2sql/latest/reference/api.html#parsing-subunit-stream-and-storing-it-in-a-db

Run Metadata
============
When creating runs with subunit2SQL and trying to display the test results with
openstack-health, there are a number of run metadata parameters that are
expected to be included with the runs via the ``run_meta`` argument. Each of
these parameters, along with the benefit provided, are explained below.

project
-------
``project`` is the default dropdown value for openstack-health. It's used
to describe what code is being tested. If you have a repository name, this
would be an ideal value. However, It's not necessary to provide this data to
enable any features, just know that a user will have to select a metadata item
from the ``Grouping`` dropdown on the home page to display results.

build_name
----------
``build_name`` will be used to represent the name of the job that was ran to
produce the subunit stream. This value will be used to aggregate your runs.

.. important:: This parameter is required for the openstack-health dashboard to
               operate without errors.

build_uuid
----------
``build_uuid`` will be used to represent the uuid of the job that was ran to
produce the subunit stream.

.. important:: This parameter is required for the openstack-health dashboard to
               operate without errors.

build_queue
-----------
``build_queue`` is used to determine what kind of queue was used to produce the
subunit stream. openstack-health only checks for the value of ``gate`` and
provides a fresh-check service as described below.

fresh-check
^^^^^^^^^^^
When you provide the ``build_queue`` key, the fresh-check service is enabled.
The latest run with the value of ``gate`` will be used to warn users that the
data collection may not be working correctly. This warning will be displayed if
the last run's ``run_at`` datetime was more than 24 hours ago.

node_provider
-------------
``node_provider`` is used to determine what host was used to produce the subunit
stream. The value of this key will be populated for you in the
``Recent Failures`` table in the tests view.

Additional Arguments
====================
This section is for arguments that are **NOT** ``run_meta`` parameters but are
included here because they are subunit2SQL arguments and provide additional
data about the run in openstack-health when used properly.

.. note:: Each of the following arguments must be set on the CLI or overridden
          with the API like in `subunit2SQL's usage pattern`_.

artifacts
---------
``artifacts`` is used to provide a URL in order to show additional run details
to the user like run logs for example. This will be linked with runs in the
following tables:

* ``Failed Tests in Last 10 Failed Runs`` on the home page in the
  ``Artifacts`` column
* ``Recent Runs`` on the job, and grouping page in the ``Link`` column.
* ``Recent Failures`` on the test page in the ``Link`` column.


run_at
------
``run_at`` is used to provide the date and time the tests were executed.

.. note:: If no value is provided, the time the run was entered into the
          database will be used.
