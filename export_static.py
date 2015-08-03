import os
import gzip
import shutil
import django

from argparse import ArgumentParser

from django.test import RequestFactory
from django.core.urlresolvers import resolve

from stackviz.parser import tempest_subunit
from stackviz import settings


EXPORT_PATHS = [
    '/index.html',
    '/tempest_summary.html',
    '/tempest_aggregate.html'
]


def fake_render_view(path):
    factory = RequestFactory()
    request = factory.get(path)

    match = resolve(path)
    response = match.func(request, *match.args, **match.kwargs)

    if hasattr(response, "render"):
        response.render()

    return response


def export_single_page(path, dest_dir, use_gzip=False):
    dest_file = path
    if dest_file.startswith('/'):
        dest_file = dest_file[1:]

    open_func = open
    if use_gzip:
        open_func = gzip.open
        dest_file += ".gz"

    with open_func(os.path.join(dest_dir, dest_file), 'wb') as f:
        content = fake_render_view(path).content

        f.write(content)


def init_django(args):
    # remove leading / from static URL to give them correct filesystem paths
    settings.STATIC_URL = settings.STATIC_URL[1:]
    settings.USE_GZIP = args.gzip

    if args.repository:
        settings.TEST_REPOSITORIES = (args.repository,)

    if args.dstat:
        settings.DSTAT_CSV = args.dstat

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stackviz.settings")
    django.setup()


def main():
    parser = ArgumentParser(description="Generates a self-contained, static "
                                        "StackViz site at the given path.")
    parser.add_argument("path",
                        help="The output directory. Will be created if it "
                             "doesn't already exist.")
    parser.add_argument("--ignore-bower",
                        help="Ignore missing Bower components.",
                        action="store_true")
    parser.add_argument("--gzip",
                        help="Enable gzip compression for data files.",
                        action="store_true")
    parser.add_argument("--repository",
                        help="The directory containing the `.testrepository` "
                             "to export. If not provided, the `settings.py` "
                             "configured value will be used.")
    parser.add_argument("--dstat",
                        help="The path to the DStat log file (CSV-formatted) "
                             "to include. If not provided, the `settings.py` "
                             "configured value will be used.")

    args = parser.parse_args()

    if not args.ignore_bower:
        if not os.listdir(os.path.join('stackviz', 'static', 'components')):
            print "Bower components have not been installed, please run " \
                  "`bower install`"
            return 1

    if os.path.exists(args.path):
        if os.listdir(args.path):
            print "Destination exists and is not empty, cannot continue"
            return 1

        os.mkdir(args.path)

    init_django(args)

    print "Copying static files ..."
    shutil.copytree(os.path.join('stackviz', 'static'),
                    os.path.join(args.path, 'static'))

    for path in EXPORT_PATHS:
        print "Rendering:", path
        export_single_page(path, args.path)

    for run_id in range(tempest_subunit.get_repositories()[0].count()):
        print "Rendering views for tempest run #%d" % run_id
        export_single_page('/tempest_timeline_%d.html' % run_id, args.path)
        export_single_page('/tempest_results_%d.html' % run_id, args.path)

        print "Exporting data for tempest run #%d" % run_id
        export_single_page('/tempest_api_tree_%d.json' % run_id,
                           args.path, args.gzip)
        export_single_page('/tempest_api_raw_%d.json' % run_id,
                           args.path, args.gzip)
        export_single_page('/tempest_api_details_%d.json' % run_id,
                           args.path, args.gzip)


if __name__ == '__main__':
    main()
