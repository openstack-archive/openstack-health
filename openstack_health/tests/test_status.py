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

from openstack_health.test_run_aggregator import Status
from openstack_health.tests import base


class TestStatus(base.TestCase):
    def test_that_success_string_translates_to_success(self):
        status = Status('success')
        self.assertEqual(True, status.is_success)
        self.assertEqual(False, status.is_failure)
        self.assertEqual(False, status.is_skip)

    def test_that_xfail_string_translates_to_success(self):
        status = Status('xfail')
        self.assertEqual(True, status.is_success)
        self.assertEqual(False, status.is_failure)
        self.assertEqual(False, status.is_skip)

    def test_that_fail_string_translates_to_failure(self):
        status = Status('fail')
        self.assertEqual(False, status.is_success)
        self.assertEqual(True, status.is_failure)
        self.assertEqual(False, status.is_skip)

    def test_that_unxsuccess_string_translates_to_failure(self):
        status = Status('unxsuccess')
        self.assertEqual(False, status.is_success)
        self.assertEqual(True, status.is_failure)
        self.assertEqual(False, status.is_skip)

    def test_that_null_translates_to_skip(self):
        status = Status(None)
        self.assertEqual(False, status.is_success)
        self.assertEqual(False, status.is_failure)
        self.assertEqual(True, status.is_skip)

    def test_that_an_empty_string_translates_to_skip(self):
        status = Status('')
        self.assertEqual(False, status.is_success)
        self.assertEqual(False, status.is_failure)
        self.assertEqual(True, status.is_skip)

    def test_that_a_random_string_translates_to_skip(self):
        status = Status('$random1234')
        self.assertEqual(False, status.is_success)
        self.assertEqual(False, status.is_failure)
        self.assertEqual(True, status.is_skip)
