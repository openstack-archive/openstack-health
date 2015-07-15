from django.conf.urls import patterns, include, url

from .latest_results import LatestResultsView
from .api import TempestRunEndpoint


urlpatterns = patterns('',
    url(r'^latest_results$', LatestResultsView.as_view()),

    url(r'^api/(\d+)/$', TempestRunEndpoint.as_view())
)
