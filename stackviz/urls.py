from django.conf.urls import patterns, include, url
from django.contrib import admin

from stackviz.views.index import IndexView

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'stackviz.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', IndexView.as_view()),
    url(r'^index.html$', IndexView.as_view(), name="index"),
    url(r'^tempest_', include('stackviz.views.tempest.urls')),
    url(r'^devstack_', include('stackviz.views.devstack.urls')),
    url(r'^upstream_', include ('stackviz.views.upstream.urls'))
)
