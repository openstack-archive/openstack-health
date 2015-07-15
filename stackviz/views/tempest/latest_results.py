from django.views.generic import TemplateView

class LatestResultsView(TemplateView):
    template_name = 'tempest/latest_results.html'
