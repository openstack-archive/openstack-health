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
from dateutil import parser
import pandas as pd

from openstack_health import base_aggregator as base


def format_output_numeric_dicts(df):
    numeric_dict = {}
    temp_dict = df.to_dict()
    for build_name in temp_dict:
        numeric_dict[build_name] = {}
        for run_at in temp_dict[build_name]:
            numeric_dict[build_name][
                run_at.isoformat()] = temp_dict[build_name][run_at]
    return numeric_dict


def get_numeric_data(run_times_time_series, sample_rate):
    if not run_times_time_series:
        return {}
    temp_dict = {}
    sample_rate = base.resample_matrix[sample_rate]
    for run_at, run in run_times_time_series.items():
        build_name, run_time = list(run.items())[0]
        if build_name in temp_dict:
            temp_dict[build_name][run_at] = run_time
        else:
            temp_dict[build_name] = {run_at: run_time}
    df = pd.DataFrame(temp_dict)
    numeric_df = df.resample(sample_rate).mean()
    temp_numeric_df = numeric_df.interpolate(method='time', limit=10)
    for build_name in numeric_df:
        numeric_df[build_name + '-avg'] = temp_numeric_df[build_name].rolling(
            10).mean()
    numeric_df = numeric_df.dropna(how='all', axis=1)
    return format_output_numeric_dicts(numeric_df)


class RunAggregator(base.BaseAggregator):
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
        # Pad the data to have a uniform sampling
        time_date_list = [parser.parse(x) for x in aggregated_runs.keys()]
        if not time_date_list:
            return aggregated_runs
        start_date = min(time_date_list)
        end_date = max(time_date_list)
        delta = end_date - start_date
        delta_secs = int(delta.total_seconds())
        if datetime_resolution == 'sec':
            timedelta = datetime.timedelta(seconds=1)
            time_count = delta_secs
        elif datetime_resolution == 'min':
            timedelta = datetime.timedelta(minutes=1)
            time_count = (delta_secs / 60)
        elif datetime_resolution == 'hour':
            timedelta = datetime.timedelta(hours=1)
            time_count = ((delta_secs / 60) / 60)
        elif datetime_resolution == 'day':
            timedelta = datetime.timedelta(days=1)
            time_count = delta.days
        time_count = int(time_count)
        for date in (start_date + timedelta * n for n in range(time_count)):
            if date not in time_date_list:
                aggregated_runs[date.isoformat()] = []
        return aggregated_runs
