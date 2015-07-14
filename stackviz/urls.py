from django.conf.urls import patterns, include, url
from django.contrib import admin

from stackviz.views.index import IndexView

import settings

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'stackviz.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', IndexView.as_view()),

)
