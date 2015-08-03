import os

from django.http import HttpResponse, Http404
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
            raise Http404("DStat log not loaded.")

        return HttpResponse(csv, content_type="text/csv")
