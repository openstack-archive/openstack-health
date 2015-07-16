from django.views.generic import TemplateView

class ResultsView(TemplateView):
    template_name = 'devstack/results.html'
