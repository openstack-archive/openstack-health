import os
import shutil
import django

from argparse import ArgumentParser

from django.test import RequestFactory
from django.core.urlresolvers import resolve

from stackviz.parser import tempest_subunit


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


def export_single_page(path, dest_dir):
    dest_file = path
    if dest_file.startswith('/'):
        dest_file = dest_file[1:]

    with open(os.path.join(dest_dir, dest_file), 'w') as f:
        content = fake_render_view(path).content

        f.write(content)


def main():
    parser = ArgumentParser(description="Generates a self-contained, static "
                                        "StackViz site at the given path.")
    parser.add_argument("path",
                        help="The output directory. Will be created if it "
                             "doesn't already exist.")
    parser.add_argument("--ignore-bower",
                        help="Ignore missing Bower components.")

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
        export_single_page('/tempest_api_tree_%d.json' % run_id, args.path)
        export_single_page('/tempest_api_raw_%d.json' % run_id, args.path)

        # TODO
        # export_single_page('tempest_api_details_%d.json' % run_id, args.path)


if __name__ == '__main__':
    # remove leading / from static URL to give them correct filesystem paths
    import stackviz.settings as settings
    settings.STATIC_URL = settings.STATIC_URL[1:]

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stackviz.settings")

    django.setup()

    main()
