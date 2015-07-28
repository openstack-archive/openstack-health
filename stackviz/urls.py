from django.conf.urls import patterns, include, url
from django.contrib import admin

from stackviz.views.index import IndexView

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'stackviz.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', IndexView.as_view()),
    url(r'^tempest/', include('stackviz.views.tempest.urls')),
    url(r'^devstack/', include('stackviz.views.devstack.urls')),
    url(r'^upstream/', include ('stackviz.views.upstream.urls'))
)
