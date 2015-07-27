from django.views.generic import TemplateView

class AggregateResultsView(TemplateView):
    template_name = 'tempest/aggregate.html'