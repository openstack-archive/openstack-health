import re

from functools import partial

from subunit import ByteStreamToStreamResult
from testtools import (StreamResult, StreamSummary,
                       StreamToDict, CopyStreamResult)

from testrepository.repository import AbstractTestRun
from testrepository.repository.file import (RepositoryFactory,
                                            Repository,
                                            RepositoryNotFound)

from stackviz import settings


NAME_SCENARIO_PATTERN = re.compile(r'^(.+) \((.+)\)$')
NAME_TAGS_PATTERN = re.compile(r'^(.+)\[(.+)\]$')


def get_repositories():
    """
    Loads all test repositories from locations configured in
    `settings.TEST_REPOSITORIES`. Only locations with a valid `.testrepository`
    subdirectory containing valid test entries will be returned.

    :return: a list of loaded :class:`Repository` instances
    :rtype: list[Repository]
    """
    factory = RepositoryFactory()

    ret = []

    for path in settings.TEST_REPOSITORIES:
        try:
            ret.append(factory.open(path))
        except (ValueError, RepositoryNotFound) as ex:
            # skip
            continue

    return ret


def _clean_name(name):
    # TODO: currently throwing away other info - any worth keeping?
    m = NAME_TAGS_PATTERN.match(name)
    if m:
        # tags = m.group(2).split(',')
        return m.group(1)

    m = NAME_SCENARIO_PATTERN.match(name)
    if m:
        return '{0}.{1}'.format(m.group(2), m.group(1))

    return name


def _strip(text):
    return re.sub(r'\W', '', text)


def _clean_details(details):
    return {_strip(k): v.as_text() for k, v in details.iteritems()
            if v.as_text()}


def _read_test(test, out, strip_details):
    # clean up the result test info a bit

    start, end = test['timestamps']

    out.append({
        'name': _clean_name(test['id']),
        'status': test['status'],
        'tags': list(test['tags']),
        'timestamps': test['timestamps'],
        'duration': (end - start).total_seconds(),
        'details': {} if strip_details else _clean_details(test['details'])
    })


def convert_run(test_run, strip_details=False):
    """
    Converts the given test run into a raw list of test dicts, using the subunit
    stream as an intermediate format.

    :param test_run: the test run to convert
    :type test_run: AbstractTestRun
    :param strip_details: if True, remove test details (e.g. stdout/stderr)
    :return: a list of individual test results
    """
    # see: read_subunit.py from subunit2sql
    ret = []

    stream = test_run.get_subunit_stream()
    result_stream = ByteStreamToStreamResult(stream)

    starts = StreamResult()
    summary = StreamSummary()
    outcomes = StreamToDict(partial(_read_test,
                                    out=ret,
                                    strip_details=strip_details))

    result = CopyStreamResult([starts, outcomes, summary])

    result.startTestRun()
    result_stream.run(result)
    result.stopTestRun()

    return ret


def _descend_recurse(parent, parts_remaining):
    if not parts_remaining:
        return parent

    target = parts_remaining.pop()

    # create elements on-the-fly
    if 'children' not in parent:
        parent['children'] = []

    # attempt to find an existing matching child
    child = None
    for c in parent['children']:
        if c['name'] == target:
            child = c
            break

    # create manually if the target child doesn't already exist
    if not child:
        child = {'name': target}
        parent['children'].append(child)

    return _descend_recurse(child, parts_remaining)


def _descend(root, path):
    """
    Retrieves the node within the `root` dict denoted by the series of
    '.'-separated children as specified in `path`. Children for each node must
    be contained in a list `children`, and name comparison will be
    performed on the field `name`.

    If parts of the path (up to and including the last child itself) do not
    exist, they will be created automatically under the root dict.

    :param root: the root node
    :param path: a '.'-separated path
    :type path: str
    :return: the dict node representing the last child
    """
    path_parts = path.split('.')
    path_parts.reverse()

    root['name'] = path_parts.pop()

    return _descend_recurse(root, path_parts)


def reorganize(converted_test_run):
    """
    Reorganizes and categorizes the given test run, forming tree of tests
    categorized by their module paths.

    :param converted_test_run:
    :return: a dict tree of test nodes, organized by module path
    """
    ret = {}

    for entry in converted_test_run:
        entry['name_full'] = entry['name']

        dest_node = _descend(ret, entry['name'])

        # update the dest node with info from the current entry, but hold on to
        # the already-parsed name
        name = dest_node['name']
        dest_node.update(entry)
        dest_node['name'] = name

    return ret
