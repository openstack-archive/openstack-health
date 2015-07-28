from django.views.generic import TemplateView

class RunView(TemplateView):
    template_name = 'upstream/run.html'