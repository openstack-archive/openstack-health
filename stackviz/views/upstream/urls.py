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

from django.conf.urls import patterns
from django.conf.urls import url

from run import RunView
from test import TestView

from api import GerritURLEndpoint

urlpatterns = patterns('',
                       url(r'^run.html$',
                           RunView.as_view(),
                           name='run_metadata'),

                       url(r'^test.html$',
                           TestView.as_view(),
                           name='test_data'),

                       url(r'^api_changeid_(?P<change_id>\d+).json$',
                           GerritURLEndpoint.as_view(),
                           name='gerrit_url')
                       )
