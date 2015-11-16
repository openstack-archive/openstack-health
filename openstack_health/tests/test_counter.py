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

from openstack_health.test_run_aggregator import Counter
from openstack_health.tests import base


class TestCounter(base.TestCase):
    def test_that_pass_counter_will_be_updated_on_success(self):
        counter = Counter(passes=0, failures=0, skips=0)
        (passes, failures, skips) = counter.update('success')
        self.assertEqual(1, passes)
        self.assertEqual(0, failures)
        self.assertEqual(0, skips)

    def test_that_fail_counter_will_be_updated_on_failure(self):
        counter = Counter(passes=0, failures=0, skips=0)
        (passes, failures, skips) = counter.update('fail')
        self.assertEqual(0, passes)
        self.assertEqual(1, failures)
        self.assertEqual(0, skips)

    def test_that_skip_counter_will_be_updated_on_skip(self):
        counter = Counter(passes=0, failures=0, skips=0)
        (passes, failures, skips) = counter.update('skip')
        self.assertEqual(0, passes)
        self.assertEqual(0, failures)
        self.assertEqual(1, skips)
