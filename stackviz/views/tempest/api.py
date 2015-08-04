# Copyright 2015 Hewlett-Packard Development Company, L.P.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from django.http import Http404
from restless.views import Endpoint

from stackviz.parser.tempest_subunit import (get_repositories,
                                             convert_run,
                                             reorganize)

#: Cached results from loaded subunit logs indexed by their run number
_cached_run = {}

#: Cached results converted into tree form
_cached_tree = {}

#: Cached results for loaded subunit logs without details stripped out. Indexed
#: initially by log number, but contains nested dicts indexed by the test name.
_cached_details = {}


class NoRunDataException(Http404):
    pass

class RunNotFoundException(Http404):
    pass

class TestNotFoundException(Http404):
    pass


def _load_run(run_id):
    if run_id in _cached_run:
        return _cached_run[run_id]

    repos = get_repositories()
    if not repos:
        raise NoRunDataException("No test repositories could be loaded")

    try:
        # assume first repo for now
        run = repos[0].get_test_run(run_id)

        # strip details for now
        # TODO: provide method for getting details on demand
        # (preferably for individual tests to avoid bloat)
        converted_run = convert_run(run, strip_details=True)
        _cached_run[run_id] = converted_run

        return converted_run
    except KeyError:
        raise RunNotFoundException("Requested test run could not be found")


def _load_tree(run_id):
    if run_id in _cached_tree:
        return _cached_tree[run_id]

    run = _load_run(run_id)
    tree = reorganize(run)

    _cached_tree[run_id] = tree
    return tree


def _load_details(run_id, test_name):
    if run_id not in _cached_details:
        repos = get_repositories()
        if not repos:
            raise NoRunDataException("No test repositories could be loaded")

        try:
            # assume first repo for now
            run = repos[0].get_test_run(run_id)
            converted_run = convert_run(run, strip_details=False)

            # remap dict to allow direct access to details via test name
            dest = {}
            for entry in converted_run:
                dest[entry['name']] = entry['details']

            _cached_details[run_id] = dest
        except KeyError:
            raise RunNotFoundException("Requested test run could not be found")

    details_map = _cached_details[run_id]
    if test_name is None:
        return details_map
    else:
        if test_name in details_map:
            return details_map[test_name]
        else:
            raise TestNotFoundException(
                "Requested test could not be found in run")


class TempestRunRawEndpoint(Endpoint):
    def get(self, request, run_id):
        return _load_run(run_id)


class TempestRunTreeEndpoint(Endpoint):
    def get(self, request, run_id):
        return _load_tree(run_id)


class TempestRunDetailsEndpoint(Endpoint):
    def get(self, request, run_id, test_name=None):
        return _load_details(run_id, test_name)

