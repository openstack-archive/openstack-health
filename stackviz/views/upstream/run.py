from django.views.generic import TemplateView

# TODO Planned f(x):
# 1. Input a run_id from an upstream run to display run info
# 2. Compare runs by metadata
#
# 1.
#   EX: url for logstash=
# http://logs.openstack.org/92/206192/2/check/gate-subunit2sql-python27/c1ff374/
#
#   a. link between logstash and subunit2sql (urlparser)
#   b. display server-side as well as client-side logs
#
class RunView(TemplateView):
    template_name = 'upstream/run.html'

