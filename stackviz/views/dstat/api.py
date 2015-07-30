from django.http import HttpResponse
from django.views.generic import View

from stackviz import settings

_cached_csv = None


def _load_csv():
    global _cached_csv

    if _cached_csv:
        return _cached_csv

    with open(settings.DSTAT_CSV, 'r') as f:
        _cached_csv = f.readlines()
        return _cached_csv


class DStatCSVEndpoint(View):
    def get(self, request):
        return HttpResponse(_load_csv(), content_type="text/csv")
