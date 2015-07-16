from django.conf.urls import patterns, include, url

from .latest_results import LatestResultsView
from .timeline import TimelineView, TimelineLatestView

from .api import (TempestRunTreeEndpoint,
                  TempestRunRawEndpoint,
                  TempestRunDetailsEndpoint)


urlpatterns = patterns('',
    url(r'^latest_results$', LatestResultsView.as_view()),

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
)
