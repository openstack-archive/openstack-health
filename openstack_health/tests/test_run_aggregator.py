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
import numpy as np

from openstack_health import run_aggregator
from openstack_health.tests import base


class TestRunAggregatorGetNumericData(base.TestCase):
    def setUp(self):
        super(TestRunAggregatorGetNumericData, self).setUp()
        self.runs = {
            datetime.datetime(2018, 6, 22, 1, 22, 45): {
                'tempest-dsvm-neutron-full': 4495.36
            },
            datetime.datetime(2018, 6, 20, 17, 34, 30): {
                'tempest-dsvm-neutron-full': 4133.03
            },
            datetime.datetime(2018, 6, 25, 1, 13, 22): {
                'tempest-dsvm-neutron-full': 6047.95
            },
            datetime.datetime(2018, 6, 22, 21, 44, 44): {
                'tempest-dsvm-neutron-full': 6689.23
            },
            datetime.datetime(2018, 6, 18, 5, 48, 36): {
                'tempest-dsvm-neutron-full': 4183.85
            },
            datetime.datetime(2018, 6, 23, 3, 44, 18): {
                'tempest-dsvm-neutron-full': 6150.95
            },
            datetime.datetime(2018, 6, 19, 10, 7, 35): {
                'tempest-dsvm-neutron-full': 4545.41
            },
            datetime.datetime(2018, 6, 13, 7, 52, 34): {
                'tempest-dsvm-neutron-full': 5651.39
            },
            datetime.datetime(2018, 6, 14, 6, 18, 18): {
                'tempest-dsvm-neutron-full': 4307.42
            },
            datetime.datetime(2018, 6, 13, 13, 44, 25): {
                'tempest-dsvm-neutron-full': 5131.0
            },
            datetime.datetime(2018, 6, 14, 3, 52, 24): {
                'tempest-dsvm-neutron-full': 5228.78
            }
        }

    def test_get_numeric_data_no_runs(self):
        expected = {}
        actual = run_aggregator.get_numeric_data({}, 'day')
        self.assertEqual(expected, actual)

    def test_get_numeric_data_diff_build_name(self):
        self.runs[datetime.datetime(2018, 6, 14, 3, 52, 24)][
            'openstack-tox-py27-trove'] = 321.304
        expected = {
            'tempest-dsvm-neutron-full': {
                '2018-06-13T00:00:00': 5391.195,
                '2018-06-14T00:00:00': 4768.1,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': 4183.85,
                '2018-06-19T00:00:00': 4545.41,
                '2018-06-20T00:00:00': 4133.03,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': 5592.295,
                '2018-06-23T00:00:00': 6150.95,
                '2018-06-24T00:00:00': np.nan,
                '2018-06-25T00:00:00': 6047.95
            },
            'tempest-dsvm-neutron-full-avg': {
                '2018-06-13T00:00:00': np.nan,
                '2018-06-14T00:00:00': np.nan,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': np.nan,
                '2018-06-19T00:00:00': np.nan,
                '2018-06-20T00:00:00': np.nan,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': 4690.44675,
                '2018-06-23T00:00:00': 4766.42225,
                '2018-06-24T00:00:00': 4899.55725,
                '2018-06-25T00:00:00': 5042.148499999999
            },
            'openstack-tox-py27-trove': {
                '2018-06-13T00:00:00': np.nan,
                '2018-06-14T00:00:00': 321.304,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': np.nan,
                '2018-06-19T00:00:00': np.nan,
                '2018-06-20T00:00:00': np.nan,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': np.nan,
                '2018-06-23T00:00:00': np.nan,
                '2018-06-24T00:00:00': np.nan,
                '2018-06-25T00:00:00': np.nan
            },
            'openstack-tox-py27-trove-avg': {
                '2018-06-13T00:00:00': np.nan,
                '2018-06-14T00:00:00': np.nan,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': np.nan,
                '2018-06-19T00:00:00': np.nan,
                '2018-06-20T00:00:00': np.nan,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': np.nan,
                '2018-06-23T00:00:00': 321.30400000000003,
                '2018-06-24T00:00:00': 321.30400000000003,
                '2018-06-25T00:00:00': np.nan
            }

        }
        actual = run_aggregator.get_numeric_data(self.runs, 'day')
        self.assertCountEqual(expected, actual)
        self.assertCountEqual(
            expected['tempest-dsvm-neutron-full'].keys(),
            actual['tempest-dsvm-neutron-full'].keys())
        self.assertCountEqual(
            expected['tempest-dsvm-neutron-full-avg'].keys(),
            actual['tempest-dsvm-neutron-full-avg'].keys())
        # np.nan == np.nan is False, remove the key entries with np.nan values,
        # if a key error is thrown then expected does not equal actual.
        for key in expected:
            for date, run_time in list(expected[key].items()):
                if np.isnan(run_time) and np.isnan(actual[key][date]):
                    del actual[key][date]
                    del expected[key][date]
        self.assertDictEqual(expected, actual)

    def test_get_numeric_data(self):
        expected = {
            'tempest-dsvm-neutron-full': {
                '2018-06-13T00:00:00': 5391.195,
                '2018-06-14T00:00:00': 4768.1,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': 4183.85,
                '2018-06-19T00:00:00': 4545.41,
                '2018-06-20T00:00:00': 4133.03,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': 5592.295,
                '2018-06-23T00:00:00': 6150.95,
                '2018-06-24T00:00:00': np.nan,
                '2018-06-25T00:00:00': 6047.95
            },
            'tempest-dsvm-neutron-full-avg': {
                '2018-06-13T00:00:00': np.nan,
                '2018-06-14T00:00:00': np.nan,
                '2018-06-15T00:00:00': np.nan,
                '2018-06-16T00:00:00': np.nan,
                '2018-06-17T00:00:00': np.nan,
                '2018-06-18T00:00:00': np.nan,
                '2018-06-19T00:00:00': np.nan,
                '2018-06-20T00:00:00': np.nan,
                '2018-06-21T00:00:00': np.nan,
                '2018-06-22T00:00:00': 4690.44675,
                '2018-06-23T00:00:00': 4766.42225,
                '2018-06-24T00:00:00': 4899.55725,
                '2018-06-25T00:00:00': 5042.148499999999
            }
        }
        actual = run_aggregator.get_numeric_data(self.runs, 'day')
        self.assertCountEqual(expected, actual)
        self.assertCountEqual(
            expected['tempest-dsvm-neutron-full'].keys(),
            actual['tempest-dsvm-neutron-full'].keys())
        self.assertCountEqual(
            expected['tempest-dsvm-neutron-full-avg'].keys(),
            actual['tempest-dsvm-neutron-full-avg'].keys())
        # np.nan == np.nan is False, remove the key entries with np.nan values,
        # if a key error is thrown then expected does not equal actual.
        for key in expected:
            for date, run_time in list(expected[key].items()):
                if np.isnan(run_time) and np.isnan(actual[key][date]):
                    del actual[key][date]
                    del expected[key][date]
        self.assertDictEqual(expected, actual)


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
        aggregator = run_aggregator.RunAggregator(self.runs)
        aggregated_runs = aggregator.aggregate(datetime_resolution='sec')

        expected_response = {
            datetime.datetime(2015, 1, 2, 12, 23, 45).isoformat(): {
                'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 22},
                    {u'fail': 0, u'skip': 89, u'pass': 1345}
                ]
            },
            datetime.datetime(2015, 1, 2, 12, 23, 46).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 47).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 48).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 49).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 50).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 51).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 52).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 53).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 54).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 55).isoformat(): [],
            datetime.datetime(2015, 1, 2, 12, 23, 56).isoformat(): {
                u'openstack/nova': [
                    {u'fail': 0, u'skip': 78, u'pass': 221},
                    {u'fail': 0, u'skip': 89, u'pass': 1345},
                    {u'fail': 0, u'skip': 78, u'pass': 229}
                ]
            }
        }

        self.assertCountEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_minute_and_project(self):
        aggregator = run_aggregator.RunAggregator(self.runs)
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
        self.assertCountEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_hour_and_project(self):
        aggregator = run_aggregator.RunAggregator(self.runs)
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
        self.assertCountEqual(expected_response, aggregated_runs)

    def test_that_runs_will_be_aggregated_by_day_and_project(self):
        aggregator = run_aggregator.RunAggregator(self.runs)
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
        self.assertCountEqual(expected_response, aggregated_runs)
