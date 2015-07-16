from django.conf.urls import patterns, include, url
from django.contrib import admin

from stackviz.views.devstack.results import ResultsView


urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'stackviz.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^results$', ResultsView.as_view()),
)
