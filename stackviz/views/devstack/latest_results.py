from django.views.generic import TemplateView

class LatestResultsView(TemplateView):
    template_name = 'devstack/latest_results.html'
