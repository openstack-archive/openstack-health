from stackviz.parser.tempest_subunit import get_repositories
from stackviz.settings import USE_GZIP

def inject_extra_context(request):
    ret = {
        'use_gzip': USE_GZIP
    }

    repos = get_repositories()
    if repos:
        ret.update({
            'tempest_latest_run': get_repositories()[0].latest_id(),
            'tempest_runs': xrange(get_repositories()[0].count()),
        })

    return ret
