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

from django.views.generic import TemplateView

# TODO Planned f(x):
# 1. Input a run_id from an upstream run to display run info
# 2. Compare runs by metadata
#
# 1.
#   EX: url for logstash=
# http://logs.openstack.org/92/206192/2/check/gate-subunit2sql-python27/c1ff374/
#
#   a. link between logstash and subunit2sql (urlparser)
#   b. display server-side as well as client-side logs
#
class RunView(TemplateView):
    template_name = 'upstream/run.html'

