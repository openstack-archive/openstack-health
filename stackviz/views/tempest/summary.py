from django.views.generic import TemplateView
from stackviz.parser.tempest_subunit import get_repositories


class SummaryView(TemplateView):
    template_name = 'tempest/summary.html'
    def get_context_data(self, **kwargs):
            context = super(SummaryView, self).get_context_data(**kwargs)
            repos = get_repositories()
            context['run_id'] = repos[0].get_latest_run().get_id()

            return context
