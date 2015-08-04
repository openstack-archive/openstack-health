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

from django.http import Http404
from django.http import HttpResponse

from django.views.generic import View

from stackviz import settings

_cached_csv = None


def _load_csv():
    global _cached_csv

    if _cached_csv:
        return _cached_csv

    try:
        with open(settings.DSTAT_CSV, 'r') as f:
            _cached_csv = f.readlines()
            return _cached_csv
    except IOError:
        return None


class DStatCSVEndpoint(View):
    def get(self, request):
        csv = _load_csv()

        if not csv:
            raise Http404("DStat log could not be loaded at path %s"
                          % settings.DSTAT_CSV)

        return HttpResponse(csv, content_type="text/csv")
