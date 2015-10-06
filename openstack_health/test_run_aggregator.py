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

from subunit2sql import read_subunit

from base_aggregator import BaseAggregator


def convert_test_runs_list_to_time_series_dict(test_runs_list):
    test_runs = {}
    for test_run in test_runs_list:
        # Populate dict
        start_time = test_run.start_time
        if start_time and test_run.start_time_microsecond:
            start_time = start_time.replace(
                microsecond=test_run.start_time_microsecond)
        if test_run.stop_time:
            stop_time = test_run.stop_time
            if test_run.stop_time_microsecond:
                stop_time = stop_time.replace(
                    microsecond=test_run.stop_time_microsecond)
        test_run_dict = {
            'run_time': read_subunit.get_duration(start_time, stop_time),
            'status': test_run.status,
            'run_id': test_run.run_id
        }
        test_runs[start_time.isoformat()] = test_run_dict
    return test_runs


class Status(object):
    def __init__(self, status):
        self.status = status

    @property
    def is_success(self):
        return self.status in ['success', 'xfail']

    @property
    def is_failure(self):
        return self.status in ['fail', 'unxsuccess']

    @property
    def is_skip(self):
        return (not self.is_success and
                not self.is_failure)


class Counter(object):
    def __init__(self, passes, failures, skips):
        self.passes = passes
        self.failures = failures
        self.skips = skips

    def _update_pass_counter(self, status):
        if status.is_success:
            self.passes = self.passes + 1

    def _update_fail_counter(self, status):
        if status.is_failure:
            self.failures = self.failures + 1

    def _update_skip_counter(self, status):
        if status.is_skip:
            self.skips = self.skips + 1

    def update(self, _status):
        status = Status(_status)
        self._update_pass_counter(status),
        self._update_fail_counter(status),
        self._update_skip_counter(status)

        return (self.passes, self.failures, self.skips)


class TestRunAggregator(BaseAggregator):
    def __init__(self, test_runs):
        self.test_runs = test_runs

    def _get_run_time(self, test_run):
        status = Status(test_run['status'])
        if status.is_success:
            return read_subunit.get_duration(test_run['start_time'],
                                             test_run['stop_time'])
        return 0

    def _moving_avg(self, curr_avg, count, value):
        return ((count * curr_avg) + value) / (count + 1)

    def _get_average_run_time(self, test_run, aggregated_test_run):
        run_time = self._get_run_time(test_run)

        status = Status(test_run['status'])
        if status.is_success:
            return self._moving_avg(
                aggregated_test_run['run_time'],
                aggregated_test_run['pass'],
                run_time)
        return 0

    def _build_aggregated_test_runs(self,
                                    updated_datetime,
                                    test_run,
                                    aggregated_test_runs):
        status = test_run['status']
        test_id = test_run['test_id']

        if updated_datetime not in aggregated_test_runs:
            passes, failures, skips = \
                Counter(passes=0, failures=0, skips=0).update(status)
            run_time = self._get_run_time(test_run)
            aggregated_test_runs[updated_datetime] = {
                test_id: {
                    'pass': passes, 'fail': failures,
                    'skip': skips, 'run_time': run_time
                }
            }
            return

        if test_id not in aggregated_test_runs[updated_datetime]:
            passes, failures, skips = \
                Counter(passes=0, failures=0, skips=0).update(status)
            run_time = self._get_run_time(test_run)
            aggregated_test_runs[updated_datetime][test_id] = {
                'pass': passes, 'fail': failures,
                'skip': skips, 'run_time': run_time
            }
            return

        aggregated_test_run = aggregated_test_runs[updated_datetime][test_id]
        passes, failures, skips = \
            Counter(
                passes=aggregated_test_run['pass'],
                failures=aggregated_test_run['fail'],
                skips=aggregated_test_run['skip']).update(status)

        average_runtime = self._get_average_run_time(test_run,
                                                     aggregated_test_run)

        aggregated_test_runs[updated_datetime][test_id] = {
            'pass': passes, 'fail': failures,
            'skip': skips, 'run_time': average_runtime
        }

    def aggregate(self, datetime_resolution='sec'):
        aggregated_test_runs = {}
        for test_run in self.test_runs:
            updated_datetime = \
                self._update_datetime_to_fit_resolution(test_run['start_time'],
                                                        datetime_resolution)
            self._build_aggregated_test_runs(updated_datetime,
                                             test_run,
                                             aggregated_test_runs)
        return aggregated_test_runs
