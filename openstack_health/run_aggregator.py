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

from base_aggregator import BaseAggregator


class RunAggregator(BaseAggregator):
    def __init__(self, runs):
        self.runs = runs

    def _build_aggregated_runs(self, execution_datetime, updated_datetime,
                               aggregated_runs):
        if updated_datetime not in aggregated_runs:
            runs_at_given_datetime = self.runs[execution_datetime]
            aggregated_runs[updated_datetime] = runs_at_given_datetime
            return

        for metadata_key in self.runs[execution_datetime]:
            runs_at_given_datetime = self.runs[execution_datetime]
            runs_by_given_metadata_key = runs_at_given_datetime[metadata_key]
            if aggregated_runs[updated_datetime].get(metadata_key, None):
                (aggregated_runs[updated_datetime][metadata_key]
                 .extend(runs_by_given_metadata_key))
            else:
                aggregated_runs[updated_datetime][metadata_key] = \
                    runs_by_given_metadata_key

    def aggregate(self, datetime_resolution='sec'):
        aggregated_runs = {}
        for execution_datetime in self.runs:
            updated_datetime = \
                self._update_datetime_to_fit_resolution(execution_datetime,
                                                        datetime_resolution)
            self._build_aggregated_runs(execution_datetime,
                                        updated_datetime,
                                        aggregated_runs)
        return aggregated_runs
