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
import tempfile
import uuid

from dateutil import parser as date_parser
import feedparser
import mock
import numpy
import six
from subunit2sql.db import models

from openstack_health import api
from openstack_health.tests import base

timestamp_a = datetime.datetime(1914, 8, 26, 20, 0, 0)
timestamp_b = datetime.datetime(1914, 8, 26, 20, 0, 1)

timestamp_s1 = datetime.datetime(1914, 8, 26, 20, 0, 0)
timestamp_s2 = datetime.datetime(1914, 8, 26, 20, 0, 1)
timestamp_s3 = datetime.datetime(1914, 8, 26, 20, 0, 2)

timestamp_m1 = datetime.datetime(1914, 8, 26, 20, 0, 0)
timestamp_m2 = datetime.datetime(1914, 8, 26, 20, 1, 0)
timestamp_m3 = datetime.datetime(1914, 8, 26, 20, 2, 0)

timestamp_h1 = datetime.datetime(1914, 8, 26, 20, 0, 0)
timestamp_h2 = datetime.datetime(1914, 8, 26, 21, 0, 0)
timestamp_h3 = datetime.datetime(1914, 8, 26, 22, 0, 0)

timestamp_d1 = datetime.datetime(1914, 8, 26, 0, 0, 0)
timestamp_d2 = datetime.datetime(1914, 8, 27, 0, 0, 0)


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

    @mock.patch('subunit2sql.db.api.get_all_run_metadata_keys',
                return_value=['build_name', 'project', 'build_uuid'])
    def test_get_run_metadata_keys(self, api_mock):
        res = self.app.get('/runs/metadata/keys')
        self.assertEqual(200, res.status_code)
        api_mock.assert_called_once_with(api.Session())
        expected_response = [
            u'build_name',
            u'project',
            u'build_uuid'
        ]
        self.assertItemsEqual(expected_response,
                              json.loads(res.data.decode('utf-8')))

    @mock.patch('subunit2sql.db.api.get_test_run_dict_by_run_meta_key_value',
                return_value=[
                    {'test_id': 'fake_test_a',
                     'status': 'success',
                     'start_time': timestamp_a,
                     'stop_time': timestamp_b},
                    {'test_id': 'fake_test_b',
                     'status': 'fail',
                     'start_time': timestamp_a,
                     'stop_time': timestamp_b}
                ])
    def test_get_test_runs_by_build_name(self, api_mock):
        res = self.app.get('/build_name/fake_tests/test_runs')
        self.assertEqual(200, res.status_code)
        api_mock.assert_called_once_with('build_name', 'fake_tests', None,
                                         None, api.Session())
        expected_response = {
            six.text_type(timestamp_a.isoformat()): {
                u'fake_test_a': {
                    u'pass': 1,
                    u'fail': 0,
                    u'skip': 0,
                    u'run_time': 1},
                u'fake_test_b': {
                    u'pass': 0,
                    u'fail': 1,
                    u'skip': 0,
                    u'run_time': 0},
            }
        }
        self.assertEqual({u'tests': expected_response},
                         json.loads(res.data.decode('utf-8')))

    def test_list_routes(self):
        res = self.app.get('/')
        res_dict = json.loads(res.data.decode('utf-8'))
        self.assertEqual(200, res.status_code)
        self.assertEqual(['routes'], list(res_dict.keys()))
        route_dict = {
            'name': 'list_routes',
            'methods': ['GET', 'HEAD', 'OPTIONS'],
            'url': '/',
        }
        self.assertIn(route_dict, res_dict['routes'])

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
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

    @mock.patch('subunit2sql.db.api.get_test_prefixes',
                return_value=['tempest', 'common', 'api'])
    def test_get_test_prefixes(self, api_mock):
        res = self.app.get('/tests/prefix')
        self.assertEqual(200, res.status_code)
        expected_response = ['tempest', 'common', 'api']
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

    @mock.patch('subunit2sql.db.api.get_tests_by_prefix',
                return_value=[models.Test(id='fake_id', test_id='prefix.test',
                                          run_count=1, success=2, failure=2,
                                          run_time=1.0)])
    def test_get_tests_by_prefix(self, api_mock):
        res = self.app.get('/tests/prefix/prefix')
        self.assertEqual(200, res.status_code)
        expected_response = {'tests': [{
            'id': 'fake_id',
            'test_id': 'prefix.test',
            'run_count': 1,
            'success': 2,
            'failure': 2,
            'run_time': 1.0
        }]}

        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

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
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

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
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

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
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

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
            u"start_time": six.text_type(format_time_a),
            u"stop_time": six.text_type(format_time_b),
            u"metadata": {
                u'attrs': u'ab,cd',
                u'tags': u'worker-1',
            }
        }}
        self.assertEqual(json.loads(res.data.decode('utf-8')),
                         expected_response)

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date_sec_res(self, api_mock):
        res = self.app.get('/runs/group_by/project')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            six.text_type(timestamp_a.isoformat()): [{
                u'pass': 2, u'fail': 3, u'skip': 1
            }]
        }}
        self.assertEqual(expected_response,
                         json.loads(res.data.decode('utf-8')))
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
            six.text_type(timestamp_a.replace(second=0,
                                              microsecond=0).isoformat()): [{
                                                  u'pass': 2,
                                                  u'fail': 3,
                                                  u'skip': 1}]
        }}
        self.assertEqual(expected_response,
                         json.loads(res.data.decode('utf-8')))

    @mock.patch('subunit2sql.db.api.get_all_runs_time_series_by_key',
                return_value={
                    timestamp_a: [{'pass': 2, 'fail': 3, 'skip': 1}]
                })
    def test_get_runs_by_date_hour_res(self, api_mock):
        res = self.app.get('/runs/group_by/projects?datetime_resolution=hour')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            six.text_type(timestamp_a.replace(minute=0, second=0,
                                              microsecond=0).isoformat()): [{
                                                  u'pass': 2,
                                                  u'fail': 3,
                                                  u'skip': 1}]
        }}
        self.assertEqual(expected_response,
                         json.loads(res.data.decode('utf-8')))

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
        date = six.text_type(timestamp_a.date().isoformat())
        expected_response = {u'runs': {
            date: {
                u'neutron': sorted([{u'pass': 2,
                                     u'fail': 0,
                                     u'skip': 1},
                                    {u'fail': 1,
                                     u'pass': 0,
                                     u'skip': 0}],
                                   key=lambda run: run['fail']),
                u'tempest': [{u'fail': 3,
                              u'pass': 2,
                              u'skip': 1}]}
        }}
        response = json.loads(res.data.decode('utf-8'))
        self.assertEqual(sorted(expected_response['runs'].keys()),
                         sorted(response['runs'].keys()))
        for project in expected_response['runs'][date]:
            self.assertIn(project, response['runs'][date])
            self.assertEqual(sorted(expected_response['runs'][date][project],
                                    key=lambda run: run['fail']),
                             sorted(response['runs'][date][project],
                                    key=lambda run: run['fail']))

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
        res = self.app.get('/runs/group_by/project?datetime_resolution=sec')
        self.assertEqual(200, res.status_code)
        expected_response = {u'runs': {
            six.text_type(timestamp_a.isoformat()): [{
                u'pass': 2, u'fail': 3, u'skip': 1
            }]
        }}
        self.assertEqual(expected_response,
                         json.loads(res.data.decode('utf-8')))
        # Ensure db api called correctly
        api_mock.assert_called_once_with('project', None, None, api.Session())

    def test_get_runs_by_date_invalid_resolution(self):
        res = self.app.get(
            '/runs/group_by/projects?datetime_resolution=century')
        self.assertEqual(res.status_code, 400)
        self.assertEqual('Datetime resolution: century, is not a valid choice',
                         res.data.decode('utf-8'))

    @mock.patch('subunit2sql.db.api.get_time_series_runs_by_key_value',
                return_value={
                    timestamp_s1: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 1.0,
                                    'metadata': {'build_name': 'value-1'}}],
                    timestamp_s2: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc2',
                                    'run_time': 2.0,
                                    'metadata': {'build_name': 'value-2'}}],
                    timestamp_s3: [{'pass': 1,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc3',
                                    'run_time': 3.0,
                                    'metadata': {'build_name': 'value-3'}}],
                })
    def test_get_runs_by_project_resolution_sec(self, api_mock):
        query = 'datetime_resolution=sec'
        res = self.app.get('/runs/key/project/openstack/trove?{0}'
                           .format(query))

        self.assertEqual(200, res.status_code)

        expected_response_data = {'timedelta': [
            {'datetime': timestamp_s1.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-1',
                           'mean_run_time': 1.0}]},
            {'datetime': timestamp_s2.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-2',
                           'mean_run_time': 2.0}]},
            {'datetime': timestamp_s3.isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 0,
                           'job_name': 'value-3',
                           'mean_run_time': 3.0}]},
        ]}
        response_data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(expected_response_data, response_data)
        api_mock.assert_called_once_with('project',
                                         'openstack/trove',
                                         None,
                                         None,
                                         api.Session())

    @mock.patch('subunit2sql.db.api.get_time_series_runs_by_key_value',
                return_value={
                    timestamp_m1: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 1.0,
                                    'metadata': {'build_name': 'value-1'}}],
                    timestamp_m2: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc2',
                                    'run_time': 2.0,
                                    'metadata': {'build_name': 'value-2'}}],
                    timestamp_m3: [{'pass': 1,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc3',
                                    'run_time': 3.0,
                                    'metadata': {'build_name': 'value-3'}}],
                })
    def test_get_runs_by_project_resolution_min(self, api_mock):
        query = 'datetime_resolution=min'
        res = self.app.get('/runs/key/project/openstack/trove?{0}'
                           .format(query))

        self.assertEqual(200, res.status_code)

        expected_response_data = {'timedelta': [
            {'datetime': timestamp_m1.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-1',
                           'mean_run_time': 1.0}]},
            {'datetime': timestamp_m2.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-2',
                           'mean_run_time': 2.0}]},
            {'datetime': timestamp_m3.isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 0,
                           'job_name': 'value-3',
                           'mean_run_time': 3.0}]},
        ]}
        response_data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(expected_response_data, response_data)
        api_mock.assert_called_once_with('project',
                                         'openstack/trove',
                                         None,
                                         None,
                                         api.Session())

    @mock.patch('subunit2sql.db.api.get_time_series_runs_by_key_value',
                return_value={
                    timestamp_h1: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 1.0,
                                    'metadata': {'build_name': 'value-1'}}],
                    timestamp_h2: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc2',
                                    'run_time': 2.0,
                                    'metadata': {'build_name': 'value-2'}}],
                    timestamp_h3: [{'pass': 1,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc3',
                                    'run_time': 3.0,
                                    'metadata': {'build_name': 'value-3'}}],
                })
    def test_get_runs_by_project_resolution_hour(self, api_mock):
        query = 'datetime_resolution=hour'
        res = self.app.get('/runs/key/project/openstack/trove?{0}'
                           .format(query))

        self.assertEqual(200, res.status_code)

        expected_response_data = {'timedelta': [
            {'datetime': timestamp_h1.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-1',
                           'mean_run_time': 1.0}]},
            {'datetime': timestamp_h2.isoformat(),
             'job_data': [{'pass': 0,
                           'fail': 1,
                           'job_name': 'value-2',
                           'mean_run_time': 2.0}]},
            {'datetime': timestamp_h3.isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 0,
                           'job_name': 'value-3',
                           'mean_run_time': 3.0}]},
        ]}
        response_data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(expected_response_data, response_data)
        api_mock.assert_called_once_with('project',
                                         'openstack/trove',
                                         None,
                                         None,
                                         api.Session())

    @mock.patch('subunit2sql.db.api.get_time_series_runs_by_key_value',
                return_value={
                    timestamp_d1: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 1.0,
                                    'metadata': {'build_name': 'value-1'}},
                                   {'pass': 10,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 9.0,
                                    'metadata': {'build_name': 'value-1'}},
                                   {'pass': 2,
                                    'fail': 2,
                                    'skip': 0,
                                    'id': 'abc2',
                                    'run_time': 2.0,
                                    'metadata': {'build_name': 'value-2'}}],
                    timestamp_d2: [{'pass': 100,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc3',
                                    'run_time': 20.0,
                                    'metadata': {'build_name': 'value-3'}}]
                })
    def test_get_runs_by_project_resolution_day(self, api_mock):
        query = 'datetime_resolution=day'
        res = self.app.get('/runs/key/project/openstack/trove?{0}'
                           .format(query))

        self.assertEqual(200, res.status_code)

        expected_response_data = {'timedelta': [
            {'datetime': timestamp_d1.date().isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 1,
                           'job_name': 'value-1',
                           'mean_run_time': 5.0},
                          {'pass': 0,
                           'fail': 1,
                           'job_name': 'value-2',
                           'mean_run_time': 2.0},
                          ]},
            {'datetime': timestamp_d2.date().isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 0,
                           'job_name': 'value-3',
                           'mean_run_time': 20.0},
                          ]}
        ]}
        response_data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(expected_response_data, response_data)
        api_mock.assert_called_once_with('project',
                                         'openstack/trove',
                                         None,
                                         None,
                                         api.Session())

    @mock.patch('subunit2sql.db.api.get_time_series_runs_by_key_value',
                return_value={
                    timestamp_d1: [{'pass': 1,
                                    'fail': 1,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 1.0,
                                    'metadata': {'build_name': 'value-1'}},
                                   {'pass': 10,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc1',
                                    'run_time': 9.0,
                                    'metadata': {'build_name': 'value-1'}},
                                   {'pass': 2,
                                    'fail': 2,
                                    'skip': 0,
                                    'id': 'abc2',
                                    'run_time': 2.0,
                                    'metadata': {'build_name': 'value-2'}}],
                    timestamp_d2: [{'pass': 100,
                                    'fail': 0,
                                    'skip': 0,
                                    'id': 'abc3',
                                    'run_time': 20.0,
                                    'metadata': {'build_name': 'value-3'}}]
                })
    def test_get_runs_by_project_by_start_and_end_date(self, api_mock):
        start_date = timestamp_d1.date().isoformat()
        stop_date = timestamp_d2.date().isoformat()
        query = ('datetime_resolution=day&start_date={0}&stop_date={1}'
                 .format(start_date, stop_date))
        res = self.app.get('/runs/key/project/openstack/trove?{0}'
                           .format(query))

        self.assertEqual(200, res.status_code)

        expected_response_data = {'timedelta': [
            {'datetime': timestamp_d1.date().isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 1,
                           'job_name': 'value-1',
                           'mean_run_time': 5.0},
                          {'pass': 0,
                           'fail': 1,
                           'job_name': 'value-2',
                           'mean_run_time': 2.0},
                          ]},
            {'datetime': timestamp_d2.date().isoformat(),
             'job_data': [{'pass': 1,
                           'fail': 0,
                           'job_name': 'value-3',
                           'mean_run_time': 20.0},
                          ]}
        ]}
        response_data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(expected_response_data, response_data)
        api_mock.assert_called_once_with('project',
                                         'openstack/trove',
                                         timestamp_d1,
                                         timestamp_d2,
                                         api.Session())

    def test_get_runs_by_project_invalid_resolution(self):
        res = self.app.get(
            '/runs/key/project/openstack/trove?datetime_resolution=century')
        self.assertEqual(res.status_code, 400)
        self.assertEqual('Datetime resolution: century, is not a valid choice',
                         res.data.decode('utf-8'))

    @mock.patch('openstack_health.api._check_db_availability',
                return_value=False)
    def test_get_status_failure(self, status_check_mock):
        expected_response = {'status': {'availability': {'database': False}}}

        response = self.app.get('/status')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(json.loads(response.data.decode('utf-8')),
                         expected_response)

    @mock.patch('openstack_health.api._check_db_availability',
                return_value=True)
    def test_get_status_success(self, status_check_mock):
        expected_response = {'status': {'availability': {'database': True}}}

        response = self.app.get('/status')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data.decode('utf-8')),
                         expected_response)

    def test_failed_runs_count_should_not_consider_unknown_ones(self):
        runs = [
            {'fail': 1, 'pass': 0},
            {'fail': 0, 'pass': 0}
        ]
        failed_runs = api._calc_amount_of_failed_runs(runs)
        self.assertEqual(failed_runs, 1)

    def test_successful_runs_count_should_not_consider_unknown_ones(self):
        runs = [
            {'fail': 0, 'pass': 1},
            {'fail': 0, 'pass': 0}
        ]
        successful_runs = api._calc_amount_of_successful_runs(runs)
        self.assertEqual(successful_runs, 1)

    @mock.patch('subunit2sql.db.api.get_test_runs_by_test_test_id',
                return_value=[models.TestRun(
                    id=2, test_id=1234, run_id=int(1234),
                    status='success', start_time=timestamp_a,
                    start_time_microsecond=0,
                    stop_time=timestamp_b,
                    stop_time_microsecond=0)])
    def test_get_test_runs_for_test(self, api_mock):
        res = self.app.get('/test_runs/fake.test.id')
        self.assertEqual(200, res.status_code)
        exp_result = {'data': {
            timestamp_a.isoformat(): {
                'run_id': 1234,
                'status': 'success',
            }}, 'numeric': {
            timestamp_a.isoformat(): {
                'avg_run_time': numpy.NaN,
                'run_time': 1.0,
                'std_dev_run_time': numpy.NaN
            }}
        }
        response_data = json.loads(res.data.decode('utf-8'))
        numpy.testing.assert_equal(exp_result, response_data)
        api_mock.assert_called_once_with('fake.test.id', start_date=None,
                                         stop_date=None,
                                         session=api.Session())

    @mock.patch('subunit2sql.db.api.get_run_metadata',
                return_value=[models.RunMetadata(key='build_name',
                                                 value='job')])
    @mock.patch('subunit2sql.db.api.get_recent_runs_by_key_value_metadata',
                return_value=[
                    models.Run(uuid='a_uuid', run_at=timestamp_a,
                               artifacts='http://fake_url', passes=2, fails=0),
                    models.Run(uuid='b_uuid', run_at=timestamp_b,
                               artifacts='http://less_fake_url', fails=1,
                               passes=42)
                ])
    def test_get_recent_runs(self, api_mock, api_meta_mock):
        res = self.app.get('/runs/key/a_key/a_value/recent')
        self.assertEqual(200, res.status_code)
        api_mock.assert_called_once_with('a_key', 'a_value',
                                         10, api.Session())
        response_data = json.loads(res.data.decode('utf-8'))
        expected_res = [{
            u'id': u'a_uuid',
            u'build_name': u'job',
            u'start_date': timestamp_a.isoformat(),
            u'link': u'http://fake_url',
            u'status': 'success'
        }, {
            u'id': u'b_uuid',
            u'build_name': u'job',
            u'start_date': timestamp_b.isoformat(),
            u'link': u'http://less_fake_url',
            u'status': 'fail'
        }]
        self.assertEqual(expected_res, response_data)

    @mock.patch('subunit2sql.db.api.get_run_metadata',
                return_value=[models.RunMetadata(key='build_name',
                                                 value='job')])
    @mock.patch('subunit2sql.db.api.get_recent_runs_by_key_value_metadata',
                return_value=[
                    models.Run(uuid='uuid', run_at=timestamp_a,
                               artifacts='http://fake_url', passes=2, fails=0,
                               id='a_id', run_time=174, skips=10),
                ])
    def test_get_recent_runs_detail(self, api_mock, api_meta_mock):
        api.Session = mock.MagicMock()
        res = self.app.get('/runs/key/a_key/a_value/recent/detail')
        self.assertEqual(200, res.status_code)
        api_mock.assert_called_once_with('a_key', 'a_value',
                                         10, api.Session())
        response_data = json.loads(res.data.decode('utf-8'))
        format_time = timestamp_a.strftime('%a, %d %b %Y %H:%M:%S GMT')
        expected_res = [{
            u'artifacts': u'http://fake_url',
            u'id': u'a_id',
            u'build_name': u'job',
            u'fails': 0,
            u'passes': 2,
            u'skips': 10,
            u'run_at': format_time,
            u'run_time': 174,
            u'uuid': u'uuid'
        }]
        self.assertEqual(expected_res, response_data)

    @mock.patch('subunit2sql.db.api.get_recent_failed_runs',
                return_value=['a_convincing_id'])
    @mock.patch('subunit2sql.db.api.get_test_runs_by_status_for_run_ids',
                return_value=[
                    {
                        'test_id': u'fake_test',
                        'link': u'fake_url',
                        'start_time': timestamp_a,
                        'stop_time': timestamp_b,
                    }
                ])
    def test_get_recent_test_failures_no_es(self, db_mock, recent_mock):
        setup_mock = mock.patch('openstack_health.api.setup')
        setup_mock.start()
        self.addCleanup(setup_mock.stop)
        api.classifier = None
        api.region = mock.MagicMock()
        api.region.cache_on_arguments = mock.MagicMock()
        api.region.cache_on_arguments.return_value = lambda x: x
        res = self.app.get('/tests/recent/fail')
        self.assertEqual(200, res.status_code)
        db_mock.assert_called_once_with('fail', ['a_convincing_id'],
                                        session=api.Session(),
                                        include_run_id=True)
        response_data = json.loads(res.data.decode('utf-8'))
        expected_resp = {
            'bugs': {},
            'test_runs': [{
                'test_id': u'fake_test',
                'link': u'fake_url',
                'start_time': timestamp_a.isoformat(),
                'stop_time': timestamp_b.isoformat(),
            }]}
        self.assertEqual(expected_resp, response_data)

    @mock.patch('subunit2sql.db.api.get_recent_failed_runs',
                return_value=['a_convincing_id'])
    @mock.patch('subunit2sql.db.api.get_test_runs_by_status_for_run_ids',
                return_value=[
                    {
                        'test_id': u'fake_test',
                        'link': u'fake_url',
                        'start_time': timestamp_a,
                        'stop_time': timestamp_b,
                    }
                ])
    @mock.patch('subunit2sql.db.api.get_run_metadata',
                return_value=[
                    models.RunMetadata(key='build_short_uuid', value='abcd'),
                    models.RunMetadata(key='build_change', value='1234'),
                    models.RunMetadata(key='build_patchset', value='3'),
                ])
    def test_get_recent_test_failures_with_es(self, meta_mock, db_mock,
                                              recent_mock):
        setup_mock = mock.patch('openstack_health.api.setup')
        setup_mock.start()
        self.addCleanup(setup_mock.stop)
        api.region = mock.MagicMock()
        api.region.cache_on_arguments = mock.MagicMock()
        api.region.cache_on_arguments.return_value = lambda x: x
        api.classifier = mock.MagicMock()
        api.classifier.classify = mock.MagicMock()
        api.classifier.classify.return_value = ['12345']
        res = self.app.get('/tests/recent/fail')
        self.assertEqual(200, res.status_code)
        db_mock.assert_called_once_with('fail', ['a_convincing_id'],
                                        session=api.Session(),
                                        include_run_id=True)
        response_data = json.loads(res.data.decode('utf-8'))
        expected_resp = {
            'bugs': {'a_convincing_id': ['12345']},
            'test_runs': [{
                'test_id': u'fake_test',
                'link': u'fake_url',
                'start_time': timestamp_a.isoformat(),
                'stop_time': timestamp_b.isoformat(),
            }]}
        self.assertEqual(expected_resp, response_data)

    def test__gen_feed(self):
        url = 'fake_url'
        key = 'zeon'
        value = 'zaku'
        fg = api._gen_feed(url, key, value)
        res = feedparser.parse(fg.rss_str())
        title = 'Failures for %s: %s' % (key, value)
        self.assertEqual(title, res['feed']['title'])
        self.assertEqual(url, res['feed']['link'])
        self.assertEqual('en', res['feed']['language'])

    @mock.patch('subunit2sql.db.api.get_recent_failed_runs_by_run_metadata',
                return_value=[
                    models.Run(uuid='a_uuid', run_at=timestamp_b,
                               artifacts='http://less_fake_url', fails=1,
                               passes=42)
                ])
    def test_get_recent_failed_runs_rss_no_previous(self, db_mock):
        api.rss_opts['data_dir'] = tempfile.gettempdir()
        api.rss_opts['frontend_url'] = 'http://status.openstack.org'
        build_uuid = str(uuid.uuid4())
        meta_mock = mock.patch(
            'subunit2sql.db.api.get_run_metadata',
            return_value=[
                models.RunMetadata(key='build_name', value='job'),
                models.RunMetadata(key='build_uuid', value=build_uuid)])
        meta_mock.start()
        self.addCleanup(meta_mock.stop)
        res = self.app.get('/runs/key/a_key/a_value/recent/rss')
        self.assertEqual(200, res.status_code)
        db_mock.assert_called_once_with('a_key', 'a_value',
                                        start_date=None, session=api.Session())
        out = feedparser.parse(res.data.decode('utf-8'))
        title = 'Failures for %s: %s' % ('a_key', 'a_value')
        self.assertEqual(title, out['feed']['title'])
        self.assertEqual('en', out['feed']['language'])
        self.assertEqual(1, len(out.entries))
        self.assertEqual(build_uuid, out.entries[0].id)
        self.assertEqual(timestamp_b,
                         date_parser.parse(out.entries[0].published).replace(
                             tzinfo=None))

    @mock.patch('subunit2sql.db.api.get_recent_failed_runs_by_run_metadata',
                return_value=[
                    models.Run(uuid='b_uuid', run_at=timestamp_b,
                               artifacts='http://less_fake_url', fails=1,
                               passes=42)
                ])
    def test_get_recent_failed_runs_rss_with_previous(self, db_mock):
        api.rss_opts['data_dir'] = tempfile.gettempdir()
        api.rss_opts['frontend_url'] = 'http://status.openstack.org'
        build_uuid = str(uuid.uuid4())
        meta_mock = mock.patch(
            'subunit2sql.db.api.get_run_metadata',
            return_value=[
                models.RunMetadata(key='build_name', value='job'),
                models.RunMetadata(key='build_uuid', value=build_uuid)])
        meta_mock.start()
        self.addCleanup(meta_mock.stop)
        res = self.app.get('/runs/key/b_key/b_value/recent/rss')
        self.assertEqual(200, res.status_code)
        db_mock.assert_called_once_with('b_key', 'b_value',
                                        start_date=None, session=api.Session())
        db_mock.reset_mock()
        res = self.app.get('/runs/key/b_key/b_value/recent/rss')
        db_mock.assert_called_once_with('b_key', 'b_value',
                                        start_date=timestamp_b,
                                        session=api.Session())
        out = feedparser.parse(res.data.decode('utf-8'))
        title = 'Failures for %s: %s' % ('b_key', 'b_value')
        self.assertEqual(title, out['feed']['title'])
        self.assertEqual('en', out['feed']['language'])
        self.assertEqual(1, len(out.entries))
        self.assertEqual(build_uuid, out.entries[0].id)
        self.assertEqual(timestamp_b,
                         date_parser.parse(out.entries[0].published).replace(
                             tzinfo=None))
