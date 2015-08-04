from django.conf.urls import patterns, include, url

from .run import RunView
from .test import TestView

from .api import GerritURLEndpoint

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
