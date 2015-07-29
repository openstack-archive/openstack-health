from django.conf.urls import patterns, include, url

from .run import RunView
from .test import TestView


urlpatterns = patterns('',

    url(r'^run/$',
        RunView.as_view(),
        name='aggregate_results'),

    url(r'^test/$',
        TestView.as_view(),
        name='summary_results')
)
