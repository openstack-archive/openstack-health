from django.conf.urls import patterns, include, url
from django.contrib import admin

from stackviz.views.devstack.latest_results import LatestResultsView


urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'stackviz.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^latest_results$', LatestResultsView.as_view()),
)
