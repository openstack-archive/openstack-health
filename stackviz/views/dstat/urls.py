from django.conf.urls import patterns, include, url

from .api import DStatCSVEndpoint

urlpatterns = patterns('',
    url(r'^log.csv$', DStatCSVEndpoint.as_view()),
)
