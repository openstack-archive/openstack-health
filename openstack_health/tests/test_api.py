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
import json

import mock
from subunit2sql.db import models

from openstack_health import api
from openstack_health.tests import base

timestamp_a = datetime.datetime(1914, 8, 26, 20, 0, 0)
timestamp_b = datetime.datetime(1914, 8, 26, 20, 0, 1)


class TestRestAPI(base.TestCase):
    def setUp(self):
        super(TestRestAPI, self).setUp()
        api.app.config['TESTING'] = True
        self.app = api.app.test_client()
        # NOTE(mtreinish): This is mocking the flask function which calls
        # whatever uses the .before_first_request decorator, simply mocking
        # out the setup function was insufficient
        setup_mock = mock.patch(
            'flask.app.Flask.try_trigger_before_first_request_functions')
        setup_mock.start()
        self.addCleanup(setup_mock.stop)
        api.Session = mock.MagicMock()

    @mock.patch('subunit2sql.db.api.get_all_tests',
                return_value=[models.Test(
                    id='fake_id', test_id='test.id', run_count=4, success=2,
                    failure=2, run_time=21.2)])
    def test_get_tests(self, api_mock):
        res = self.app.get('/tests')
        self.assertEqual(200, res.status_code)
        expected_response = {'tests': [
            {"failure": 2,
             "id": "fake_id",
             "run_count": 4,
             "run_time": 21.2,
             "success": 2,
             "test_id": "test.id"}
        ]}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_all_runs_by_date',
                return_value=[models.Run(
                    id='fake_id', skips=2, fails=4, passes=2, run_time=21.2,
                    artifacts='fake_url.com',
                    run_at=timestamp_a)])
    def test_get_runs(self, api_mock):
        res = self.app.get('/runs')
        self.assertEqual(200, res.status_code)
        format_time = timestamp_a.strftime('%a, %d %b %Y %H:%M:%S GMT')
        expected_response = {'runs': [
            {"fails": 4,
             "id": "fake_id",
             "skips": 2,
             "run_time": 21.2,
             "passes": 2,
             "artifacts": "fake_url.com",
             "run_at": format_time}
        ]}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_all_test_runs',
                return_value=[models.TestRun(
                    id='fake_id', test_id='test.id', run_id='fake_run_id',
                    status='success', start_time=timestamp_a,
                    stop_time=timestamp_b)])
    def test_get_test_runs(self, api_mock):
        res = self.app.get('/test_runs')
        self.assertEqual(200, res.status_code)
        format_time_a = timestamp_a.strftime('%a, %d %b %Y %H:%M:%S GMT')
        format_time_b = timestamp_b.strftime('%a, %d %b %Y %H:%M:%S GMT')
        expected_response = {'test_runs': [
            {"id": "fake_id",
             "run_id": "fake_run_id",
             "status": "success",
             "start_time": format_time_a,
             "stop_time": format_time_b,
             "test_id": "test.id"}
        ]}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_runs_by_key_value',
                return_value=[models.Run(
                    id='fake_id', skips=2, fails=4, passes=2, run_time=21.2,
                    artifacts='fake_url.com',
                    run_at=timestamp_a)])
    def test_get_runs_from_build_name(self, api_mock):
        res = self.app.get('/build_name/test_build_name/runs')
        self.assertEqual(200, res.status_code)
        format_time = timestamp_a.strftime('%a, %d %b %Y %H:%M:%S GMT')
        expected_response = {'runs': [
            {"fails": 4,
             "id": "fake_id",
             "skips": 2,
             "run_time": 21.2,
             "passes": 2,
             "artifacts": "fake_url.com",
             "run_at": format_time}
        ]}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_tests_from_run_id',
                return_value=[models.Test(
                    id='fake_id', test_id='test.id', run_count=4, success=2,
                    failure=2, run_time=21.2)])
    def test_get_tests_from_run(self, api_mock):
        res = self.app.get('/run/fake_id/tests')
        self.assertEqual(200, res.status_code)
        expected_response = {'tests': [
            {"failure": 2,
             "id": "fake_id",
             "run_count": 4,
             "run_time": 21.2,
             "success": 2,
             "test_id": "test.id"}
        ]}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_tests_run_dicts_from_run_id',
                return_value={'tempest.api.compute.test_servers': {
                    'status': 'success',
                    'start_time': timestamp_a,
                    'stop_time': timestamp_b,
                    'metadata': {
                        'attrs': 'ab,cd',
                        'tags': 'worker-1',
                        }
                    }
                })
    def test_get_run_test_runs(self, api_mock):
        res = self.app.get('/run/test_run_id/test_runs')
        self.assertEqual(200, res.status_code)
        format_time_a = timestamp_a.strftime('%a, %d %b %Y %H:%M:%S GMT')
        format_time_b = timestamp_b.strftime('%a, %d %b %Y %H:%M:%S GMT')
        expected_response = {u'tempest.api.compute.test_servers': {
            u"status": u"success",
            u"start_time": unicode(format_time_a),
            u"stop_time": unicode(format_time_b),
            u"metadata": {
                u'attrs': u'ab,cd',
                u'tags': u'worker-1',
            }
        }}
        self.assertEqual(json.loads(res.data), expected_response)

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date(self, api_mock):
        res = self.app.get('/runs/group_by/project')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            unicode(timestamp_a.isoformat()): [{
                u'pass': 2, u'fail': 3, u'skip': 1
            }]
        }}
        self.assertEqual(expected_response, json.loads(res.data))
        # Ensure db api called correctly
        api_mock.assert_called_once_with('project', None, None, api.Session())

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date_min_res(self, api_mock):
        res = self.app.get('/runs/group_by/project?datetime_resolution=min')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            unicode(timestamp_a.replace(second=0,
                                        microsecond=0).isoformat()): [{
                                            u'pass': 2,
                                            u'fail': 3,
                                            u'skip': 1}]
        }}
        self.assertEqual(expected_response, json.loads(res.data))

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date_hour_res(self, api_mock):
        res = self.app.get('/runs/group_by/projects?datetime_resolution=hour')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            unicode(timestamp_a.replace(minute=0, second=0,
                                        microsecond=0).isoformat()): [{
                                            u'pass': 2,
                                            u'fail': 3,
                                            u'skip': 1}]
        }}
        self.assertEqual(expected_response, json.loads(res.data))

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: {'tempest': [{'pass': 2,
                                               'fail': 3,
                                               'skip': 1}],
                                  'neutron': [{'pass': 2,
                                               'fail': 0,
                                               'skip': 1}]},
                    timestamp_b: {'neutron': [{'pass': 0,
                                               'fail': 1,
                                               'skip': 0}]}
                })
    def test_get_runs_by_date_day_res(self, api_mock):
        res = self.app.get('runs/group_by/projects?datetime_resolution=day')
        self.assertEqual(200, res.status_code)
        date = unicode(timestamp_a.date().isoformat())
        expected_response = {u'runs': {
            date: {
                u'neutron': sorted([{u'pass': 2,
                                     u'fail': 0,
                                     u'skip': 1},
                                    {u'fail': 1,
                                     u'pass': 0,
                                     u'skip': 0}]),
                u'tempest': [{u'fail': 3,
                              u'pass': 2,
                              u'skip': 1}]}
        }}
        response = json.loads(res.data)
        self.assertEqual(sorted(expected_response['runs'].keys()),
                         sorted(response['runs'].keys()))
        for project in expected_response['runs'][date]:
            self.assertIn(project, response['runs'][date])
            self.assertEqual(sorted(expected_response['runs'][date][project]),
                             sorted(response['runs'][date][project]))

    def test_parse_datetimes_isoformat(self):
        parsed_out = api._parse_datetimes(timestamp_a.isoformat())
        self.assertEqual(timestamp_a, parsed_out)

    def test_parse_datetimes_almost_isoformat(self):
        format_str = timestamp_a.strftime('%Y-%m-%d %H:%M:%S')
        parsed_out = api._parse_datetimes(format_str)
        self.assertEqual(timestamp_a, parsed_out)

    def test_parse_datetimes_no_input(self):
        parsed_out = api._parse_datetimes('')
        self.assertEqual('', parsed_out)
        parsed_out = api._parse_datetimes(None)
        self.assertIsNone(parsed_out)

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date_explicit_sec_res(self, api_mock):
        api.Session = mock.MagicMock()
        res = self.app.get('/runs/group_by/project?datetime_resolution=sec')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            unicode(timestamp_a.isoformat()): [{
                u'pass': 2, u'fail': 3, u'skip': 1
            }]
        }}
        self.assertEqual(expected_response, json.loads(res.data))
        # Ensure db api called correctly
        api_mock.assert_called_once_with('project', None, None, api.Session())

    def test_get_runs_by_date_invalid_resolution(self):
        res = self.app.get(
            '/runs/group_by/projects?datetime_resolution=century')
        self.assertEqual(res.status_code, 400)
        self.assertEqual('Datetime resolution: century, is not a valid choice',
                         res.data)
