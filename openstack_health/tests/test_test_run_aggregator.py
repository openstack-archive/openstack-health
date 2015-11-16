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

from openstack_health.test_run_aggregator import TestRunAggregator
from openstack_health.tests import base


class TestTestRunAggregator(base.TestCase):
    def setUp(self):
        super(TestTestRunAggregator, self).setUp()

        timestamp_a = datetime.datetime(2015, 1, 2, 12, 23, 45)
        timestamp_b = datetime.datetime(2015, 1, 2, 12, 23, 56)
        timestamp_c = datetime.datetime(2015, 1, 2, 12, 24, 23)

        self.test_runs = [
            {'test_id': 'nova_test', 'status': 'success',
             'start_time': timestamp_a, 'stop_time': timestamp_b},
            {'test_id': 'neutron_test', 'status': 'fail',
             'start_time': timestamp_a, 'stop_time': timestamp_c},
            {'test_id': 'sahara_test', 'status': 'fail',
             'start_time': timestamp_b, 'stop_time': timestamp_c}
        ]

    def test_that_test_runs_will_be_aggregated_by_seconds(self):
        aggregator = TestRunAggregator(self.test_runs)
        aggregated_test_runs = aggregator.aggregate(datetime_resolution='sec')

        expected_response = {
            '2015-01-02T12:23:56': {
                'sahara_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                }
            },
            '2015-01-02T12:23:45': {
                'nova_test': {
                    'run_time': 11.0, 'fail': 0, 'pass': 1, 'skip': 0
                },
                'neutron_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                }
            }
        }

        self.assertItemsEqual(expected_response, aggregated_test_runs)
        expected_sahara_test = (expected_response['2015-01-02T12:23:56']
                                                 ['sahara_test'])
        actual_sahara_test = (aggregated_test_runs['2015-01-02T12:23:56']
                                                  ['sahara_test'])
        self.assertEqual(expected_sahara_test, actual_sahara_test)

        expected_nova_test = (expected_response['2015-01-02T12:23:45']
                                               ['nova_test'])
        actual_nova_test = (aggregated_test_runs['2015-01-02T12:23:45']
                                                ['nova_test'])
        self.assertEqual(expected_nova_test, actual_nova_test)

        expected_neutron_test = (expected_response['2015-01-02T12:23:45']
                                                  ['neutron_test'])
        actual_neutron_test = (aggregated_test_runs['2015-01-02T12:23:45']
                                                   ['neutron_test'])
        self.assertEqual(expected_neutron_test, actual_neutron_test)

    def test_that_test_runs_will_be_aggregated_by_minutes(self):
        aggregator = TestRunAggregator(self.test_runs)
        aggregated_test_runs = aggregator.aggregate(datetime_resolution='min')

        expected_response = {
            '2015-01-02T12:23:00': {
                'sahara_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                },
                'nova_test': {
                    'run_time': 11.0, 'fail': 0, 'pass': 1, 'skip': 0
                },
                'neutron_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                }
            }
        }

        self.assertItemsEqual(expected_response, aggregated_test_runs)
        expected_sahara_test = (expected_response['2015-01-02T12:23:00']
                                                 ['sahara_test'])
        actual_sahara_test = (aggregated_test_runs['2015-01-02T12:23:00']
                                                  ['sahara_test'])
        self.assertEqual(expected_sahara_test, actual_sahara_test)

        expected_nova_test = (expected_response['2015-01-02T12:23:00']
                                               ['nova_test'])
        actual_nova_test = (aggregated_test_runs['2015-01-02T12:23:00']
                                                ['nova_test'])
        self.assertEqual(expected_nova_test, actual_nova_test)

        expected_neutron_test = (expected_response['2015-01-02T12:23:00']
                                                  ['neutron_test'])
        actual_neutron_test = (aggregated_test_runs['2015-01-02T12:23:00']
                                                   ['neutron_test'])
        self.assertEqual(expected_neutron_test, actual_neutron_test)

    def test_that_test_runs_will_be_aggregated_by_hour(self):
        aggregator = TestRunAggregator(self.test_runs)
        aggregated_test_runs = aggregator.aggregate(datetime_resolution='hour')

        expected_response = {
            '2015-01-02T12:00:00': {
                'sahara_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                },
                'nova_test': {
                    'run_time': 11.0, 'fail': 0, 'pass': 1, 'skip': 0
                },
                'neutron_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                }
            }
        }

        self.assertItemsEqual(expected_response, aggregated_test_runs)
        expected_sahara_test = (expected_response['2015-01-02T12:00:00']
                                                 ['sahara_test'])
        actual_sahara_test = (aggregated_test_runs['2015-01-02T12:00:00']
                                                  ['sahara_test'])
        self.assertEqual(expected_sahara_test, actual_sahara_test)

        expected_nova_test = (expected_response['2015-01-02T12:00:00']
                                               ['nova_test'])
        actual_nova_test = (aggregated_test_runs['2015-01-02T12:00:00']
                                                ['nova_test'])
        self.assertEqual(expected_nova_test, actual_nova_test)

        expected_neutron_test = (expected_response['2015-01-02T12:00:00']
                                                  ['neutron_test'])
        actual_neutron_test = (aggregated_test_runs['2015-01-02T12:00:00']
                                                   ['neutron_test'])
        self.assertEqual(expected_neutron_test, actual_neutron_test)

    def test_that_test_runs_will_be_aggregated_by_day(self):
        aggregator = TestRunAggregator(self.test_runs)
        aggregated_test_runs = aggregator.aggregate(datetime_resolution='day')

        expected_response = {
            '2015-01-02': {
                'sahara_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                },
                'nova_test': {
                    'run_time': 11.0, 'fail': 0, 'pass': 1, 'skip': 0
                },
                'neutron_test': {
                    'run_time': 0, 'fail': 1, 'pass': 0, 'skip': 0
                }
            }
        }

        self.assertItemsEqual(expected_response, aggregated_test_runs)
        expected_sahara_test = (expected_response['2015-01-02']
                                                 ['sahara_test'])
        actual_sahara_test = (aggregated_test_runs['2015-01-02']
                                                  ['sahara_test'])
        self.assertEqual(expected_sahara_test, actual_sahara_test)

        expected_nova_test = (expected_response['2015-01-02']
                                               ['nova_test'])
        actual_nova_test = (aggregated_test_runs['2015-01-02']
                                                ['nova_test'])
        self.assertEqual(expected_nova_test, actual_nova_test)

        expected_neutron_test = (expected_response['2015-01-02']
                                                  ['neutron_test'])
        actual_neutron_test = (aggregated_test_runs['2015-01-02']
                                                   ['neutron_test'])
        self.assertEqual(expected_neutron_test, actual_neutron_test)
