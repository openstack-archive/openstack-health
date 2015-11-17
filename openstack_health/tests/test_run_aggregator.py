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

import datetime

from openstack_health.run_aggregator import RunAggregator
from openstack_health.tests import base


class TestRunAggregator(base.TestCase):
    def setUp(self):
        super(TestRunAggregator, self).setUp()
        self.runs = {
            datetime.datetime(2015, 1, 2, 12, 23, 45): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345}
                ]
            },
            datetime.datetime(2015, 1, 2, 12, 23, 56): {
                u'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }

    def test_that_runs_will_be_aggregated_by_seconds_and_project(self):
        aggregator = RunAggregator(self.runs)
        aggregated_runs = aggregator.aggregate(datetime_resolution='sec')

        expected_response = {
            datetime.datetime(2015, 1, 2, 12, 23, 45).isoformat(): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345}
                ]
            },
            datetime.datetime(2015, 1, 2, 12, 23, 56).isoformat(): {
                u'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }

        self.assertItemsEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_minute_and_project(self):
        aggregator = RunAggregator(self.runs)
        aggregated_runs = aggregator.aggregate(datetime_resolution='min')

        expected_response = {
            datetime.datetime(2015, 1, 2, 12, 23).isoformat(): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }
        self.assertItemsEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_hour_and_project(self):
        aggregator = RunAggregator(self.runs)
        aggregated_runs = aggregator.aggregate(datetime_resolution='hour')

        expected_response = {
            datetime.datetime(2015, 1, 2, 12).isoformat(): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }
        self.assertItemsEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_day_and_project(self):
        aggregator = RunAggregator(self.runs)
        aggregated_runs = aggregator.aggregate(datetime_resolution='day')

        expected_response = {
            datetime.date(2015, 1, 2).isoformat(): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }
        self.assertItemsEqual(expected_response, aggregated_runs)
