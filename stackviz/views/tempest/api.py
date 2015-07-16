from django.http import Http404
from restless.views import Endpoint

from stackviz.parser.tempest_subunit import (get_repositories,
                                             convert_run,
                                             reorganize)

#: Cached results from loaded subunit logs indexed by their run number
_cached_run = {}

#: Cached results converted into tree form
_cached_tree = {}


class NoRunDataException(Exception):
    pass

class RunNotFoundException(Exception):
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


class TempestRunRawEndpoint(Endpoint):
    def get(self, request, run_id):
        return _load_run(run_id)


class TempestRunTreeEndpoint(Endpoint):
    def get(self, request, run_id):
        return _load_tree(run_id)


class TempestRunDetailsEndpoint(Endpoint):
    def get(self, request, run_id, test_name):
        for test in _load_run(run_id):
            if test['name'] == test_name:
                return test['details']

        raise TestNotFoundException('No test with matching name found')

