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

import os
import re
import shutil
import subunit
import sys

from functools import partial
from io import BytesIO

from testtools import CopyStreamResult
from testtools import StreamResult
from testtools import StreamSummary
from testtools import StreamToDict

from testrepository.repository.file import RepositoryFactory
from testrepository.repository.file import RepositoryNotFound

from stackviz import settings


NAME_SCENARIO_PATTERN = re.compile(r'^(.+) \((.+)\)$')
NAME_TAGS_PATTERN = re.compile(r'^(.+)\[(.+)\]$')


_provider_cache = None


class InvalidSubunitProvider(Exception):
    pass


class SubunitProvider(object):
    @property
    def name(self):
        """Returns a unique name for this provider, such that a valid URL
        fragment pointing to a particular stream from this provider is
        `name_index`, applicable for paths to pages and data files making use
        of the stream.

        :return: a path fragment referring to the stream at `index` from this
                 provider
        """
        raise NotImplementedError()

    @property
    def description(self):
        """Returns a user-facing description for this provider.

        This description may be used in UI contexts, but will not be used
        within paths or other content-sensitive contexts.

        :return: a description for this provider
        """
        raise NotImplementedError()

    @property
    def count(self):
        raise NotImplementedError()

    def describe(self, index):
        """Returns a short, user-visible description for the contents of this
        subunit stream provider.

        :return: a description that can apply to all streams returned by this
                 provider
        """
        raise NotImplementedError()

    def get_stream(self, index):
        """Returns a file-like object representing the subunit stream at the
        given index.

        :param index: the index of the stream; must be between `0` and
                      `count - 1` (inclusive)
        """
        raise NotImplementedError()

    @property
    def indexes(self):
        # for the benefit of django templates
        return range(self.count)

    @property
    def streams(self):
        """Creates a generator that iterates over each stream available in
        this provider.

        :return: each stream available from this generator
        """
        for i in range(self.count):
            yield self.get_stream(i)


class RepositoryProvider(SubunitProvider):
    def __init__(self, repository_path):
        self.repository_path = repository_path
        self.repository = RepositoryFactory().open(repository_path)

    @property
    def name(self):
        return "repo_%s" % os.path.basename(self.repository_path)

    @property
    def description(self):
        return "Repository: %s" % os.path.basename(self.repository_path)

    @property
    def count(self):
        return self.repository.count()

    def describe(self, index):
        return "Repository (%s): #%d" % (
            os.path.basename(self.repository_path),
            index
        )

    def get_stream(self, index):
        return self.repository.get_latest_run().get_subunit_stream()


class FileProvider(SubunitProvider):
    def __init__(self, path):
        if not os.path.exists(path):
            raise InvalidSubunitProvider("Stream doesn't exist: %s" % path)

        self.path = path

    @property
    def name(self):
        return "file_%s" % os.path.basename(self.path)

    @property
    def description(self):
        return "Subunit File: %s" % os.path.basename(self.path)

    @property
    def count(self):
        return 1

    def describe(self, index):
        return "File: %s" % os.path.basename(self.path)

    def get_stream(self, index):
        if index != 0:
            raise IndexError("Index out of bounds: %d" % index)

        return open(self.path, "r")


class StandardInputProvider(SubunitProvider):
    def __init__(self):
        self.buffer = BytesIO()
        shutil.copyfileobj(sys.stdin, self.buffer)
        self.buffer.seek(0)

    @property
    def name(self):
        return "stdin"

    @property
    def description(self):
        return "Subunit Stream (stdin)"

    @property
    def count(self):
        return 1

    def get_stream(self, index):
        if index != 0:
            raise IndexError()

        return self.buffer


def get_providers():
    """Loads all test providers from locations configured in settings.

    :return: a dict of loaded provider names and their associated
             :class:`SubunitProvider` instances
    :rtype: dict[str, SubunitProvider]
    """
    global _provider_cache

    if _provider_cache is not None:
        return _provider_cache

    _provider_cache = {}

    for path in settings.TEST_REPOSITORIES:
        try:
            p = RepositoryProvider(path)
            _provider_cache[p.name] = p
        except (ValueError, RepositoryNotFound):
            continue

    for path in settings.TEST_STREAMS:
        try:
            p = FileProvider(path)
            _provider_cache[p.name] = p
        except InvalidSubunitProvider:
            continue

    if settings.TEST_STREAM_STDIN:
        p = StandardInputProvider()
        _provider_cache[p.name] = p

    return _provider_cache


def _clean_name(name):
    # TODO(Tim Buckley) currently throwing away other info - any worth keeping?
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


def convert_stream(stream_file, strip_details=False):
    """Converts a subunit stream into a raw list of test dicts.

    :param stream_file: subunit stream to be converted
    :param strip_details: if True, remove test details (e.g. stdout/stderr)
    :return: a list of individual test results
    """

    ret = []

    result_stream = subunit.ByteStreamToStreamResult(stream_file)
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


def convert_run(test_run, strip_details=False):
    """Converts the given test run into a raw list of test dicts.

    Uses the subunit stream as an intermediate format.(see: read_subunit.py
    from subunit2sql)

    :param test_run: the test run to convert
    :type test_run: AbstractTestRun
    :param strip_details: if True, remove test details (e.g. stdout/stderr)
    :return: a list of individual test results
    """

    return convert_stream(test_run.get_subunit_stream(), strip_details)


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
    """Retrieves the node within the 'root' dict

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
    """Reorganizes test run, forming trees based on module paths

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
