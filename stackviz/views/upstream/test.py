from django.views.generic import TemplateView

# TODO: Planned f(x):
# Compare one specific test against its moving average
#

class TestView(TemplateView):
    template_name = 'upstream/test.html'