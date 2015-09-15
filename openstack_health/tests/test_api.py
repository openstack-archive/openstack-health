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

timestamp_a = datetime.datetime(1914, 8, 26, 20, 00, 00)


class TestRestAPI(base.TestCase):
    def setUp(self):
        super(TestRestAPI, self).setUp()
        api.app.config['TESTING'] = True
        self.app = api.app.test_client()

    @mock.patch('subunit2sql.db.api.get_all_tests',
                return_value=[models.Test(
                    id='fake_id', test_id='test.id', run_count=4, success=2,
                    failure=2, run_time=21.2)])
    def test_get_tests(self, api_mock):
        api.Session = mock.MagicMock()
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
        api.Session = mock.MagicMock()
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
