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

resample_matrix = {
    'day': 'D',
    'hour': '1H',
    'min': '1T',
    'sec': '1S',
}


class BaseAggregator(object):
    def _update_datetime_to_fit_resolution(self,
                                           execution_datetime,
                                           datetime_resolution):
        if datetime_resolution == 'sec':
            return execution_datetime.replace(microsecond=0).isoformat()
        elif datetime_resolution == 'min':
            return execution_datetime.replace(second=0,
                                              microsecond=0).isoformat()
        elif datetime_resolution == 'hour':
            return execution_datetime.replace(minute=0,
                                              second=0,
                                              microsecond=0).isoformat()
        elif datetime_resolution == 'day':
            return execution_datetime.date().isoformat()
