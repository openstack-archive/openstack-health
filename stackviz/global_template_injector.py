from stackviz.parser.tempest_subunit import get_repositories


def inject_extra_context(request):
    return {
        'tempest_latest_run': get_repositories()[0].latest_id()
    }
