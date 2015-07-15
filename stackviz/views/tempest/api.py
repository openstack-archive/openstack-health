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


def _load_run(run_id):
    if run_id in _cached_run:
        return _cached_run[run_id]

    repos = get_repositories()
    if not repos:
        raise NoRunDataException()

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
        raise RunNotFoundException()


def _load_tree(run_id):
    if run_id in _cached_tree:
        return _cached_tree[run_id]

    run = _load_run(run_id)
    tree = reorganize(run)

    _cached_tree[run_id] = tree
    return tree


class TempestRunEndpoint(Endpoint):
    def get(self, request, run_id):
        return _load_tree(run_id)


# TODO: run details
# class TempestRunDetailsEndpoint(Endpoint):
#     def get(self, request, run_id, test_path):
#         ...

