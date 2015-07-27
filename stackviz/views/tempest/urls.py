from django.conf.urls import patterns, include, url

from .results import ResultsView,LatestResultsView
from .timeline import TimelineView, TimelineLatestView
from .aggregate import AggregateResultsView
from .summary import SummaryView

from .api import (TempestRunTreeEndpoint,
                  TempestRunRawEndpoint,
                  TempestRunDetailsEndpoint)


urlpatterns = patterns('',
    url(r'^results/(?P<run_id>\d+)/$',
        ResultsView.as_view(),
        name='tempest_results'),
    url(r'^results/$',
        LatestResultsView.as_view(),
        name='tempest_results_latest'),

    url(r'^timeline/(?P<run_id>\d+)/$',
        TimelineView.as_view(),
        name='tempest_timeline'),
    url(r'^timeline/$',
        TimelineLatestView.as_view(),
        name='tempest_timeline_latest'),

    url(r'^api/tree/(?P<run_id>\d+)/$',
        TempestRunTreeEndpoint.as_view(),
        name='tempest_api_tree'),
    url(r'^api/raw/(?P<run_id>\d+)/$',
        TempestRunRawEndpoint.as_view(),
        name='tempest_api_raw'),
    url(r'^api/details/(\d+)/([^/]+)/$',
        TempestRunDetailsEndpoint.as_view(),
        name='tempest_api_details'),

    url(r'^aggregate/$',
        AggregateResultsView.as_view(),
        name='aggregate_results'),

    url(r'^summary/$',
        SummaryView.as_view(),
        name='summary_results')
)
