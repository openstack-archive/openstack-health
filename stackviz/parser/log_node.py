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

import six

from datetime import datetime
from datetime import timedelta

from inspect import getmembers
from numbers import Number

#: The default cutoff for log entries when pruning takes place, in seconds
DEFAULT_PRUNE_CUTOFF = 0.05


class LogNode(object):
    """Represents an entry in an ordered event log.

    Represents an entry in an ordered event log. consisting of a date, message,
    and an arbitrary set of child nodes.

    Note that entries are assumed to be strictly sequential and linear, and all
    nodes must have a correctly-set `next_sibling` pointing to the next
    chronological log entry, regardless of child depth.

    This class implements a custom IPython repr useful for interactive use.
    """

    def __init__(self, date, message):
        self.date = date
        self.message = message
        self.next_sibling = None

        self.children = []

    @property
    def duration(self):
        """Determines aggregate duration for this node

        Determines the overall duration for this node, beginning at this parent
        node's start time through the final child's ending time.
        """

        if self.children:
            last_sibling = self.children[-1].next_sibling
            if not last_sibling:
                # if no last sibling exists, use the last child itself to
                # keep as close as possible to the true value
                last_sibling = self.children[-1]

            diff = last_sibling.date - self.date
            return diff + last_sibling.duration
        else:
            # attempt get self execution time
            if self.next_sibling:
                return self.next_sibling.date - self.date
            else:
                return timedelta()

    @property
    def duration_self(self):
        if not self.next_sibling:
            return timedelta()

        return self.next_sibling.date - self.date

    def traverse(self):
        """A generator that traverses all nodes of this tree sequentially"""

        for child in self.children:
            yield child

            for subchild in child.traverse():
                yield subchild

    def __repr__(self):
        return "%s(%s, '%s', duration=%d)" % (
            self.__class__.__name__,
            self.date.strftime('%H:%M:%S.%f'),
            self.message,
            self.duration.total_seconds()
        )

    def _repr_pretty_(self, p, cycle):
        tc = __import__('IPython').utils.coloransi.TermColors()

        c = self.__class__.__name__
        if cycle:
            p.text('%s(...)' % c)
            return

        with p.group(4, '%s%s%s(' % (tc.Green, c, tc.Normal), ')'):
            i = 0
            p.breakable()
            for field_name, value in reversed(getmembers(self)):
                if field_name.startswith('_'):
                    continue

                if field_name in ('next_sibling', 'traverse'):
                    continue

                if i:
                    p.text(',')
                    p.breakable()

                p.text('%s%s %s=%s ' % (
                    tc.Brown, field_name,
                    tc.DarkGray, tc.Normal))

                if isinstance(value, list):
                    lp = (tc.Cyan, tc.Normal)
                    with p.group(4, '%s[%s' % lp, '%s]%s' % lp):
                        l_first = True

                        count = 0
                        for x in value:
                            if not l_first:
                                p.text(', ')

                            p.breakable()
                            p.pretty(x)

                            l_first = False

                            count += 1

                            if count > 10:
                                p.breakable()
                                p.text('%s... %d more ...%s' % (
                                    tc.LightGreen,
                                    len(value) - count,
                                    tc.Normal
                                ))

                                break
                else:
                    if value is None:
                        p.text(tc.Blue)
                    elif isinstance(value, six.string_types):
                        p.text(tc.Red)
                    elif isinstance(value, Number):
                        p.text(tc.DarkGray)

                    p.pretty(value)
                    p.text(tc.Normal)

                i += 1


def prune(nodes, cutoff=DEFAULT_PRUNE_CUTOFF, fill=None):
    """Prunes given list of `LogNode` instances.

    Prunes the given list of `LogNode` instances, removing nodes whose duration
    is less than the given cutoff value. If a `fill` value is provided, removed
    nodes will be replaced with a single filler value accounting for the lost
    duration. This filler value will be inserted at the end of the list and
    will not be properly linked to other values.

    Note that returned values will not necessarily be a continuous list of
    nodes. The original list will remain unchanged; sibling and child
    references will not be modified to point to account any modified, removed,
    or added nodes.

    :param nodes: the list of log nodes to prune
    :type nodes: list[LogNode]
    :param fill: if set, replace removed nodes with a single larger node
    :type fill: str | None
    :param cutoff: the minimum duration for nodes that will be retained in the
                   tree
    :type cutoff: float
    :return: a (potentially) reduced list of nodes
    """

    ret = []

    fill_amount = 0.0

    for entry in nodes:
        d = entry.duration.total_seconds()
        if d >= cutoff:
            ret.append(entry)
        else:
            fill_amount += d

    if fill:
        # create a dummy filler node with an arbitrary time to account for the
        # change in total duration
        time = datetime.now()

        node = LogNode(time, fill)
        node.next_sibling = LogNode(time + timedelta(seconds=fill_amount), '')
        ret.append(node)

    return ret
