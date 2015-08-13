# Copyright 2015 Hewlett-Packard Development Company, L.P.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from __future__ import print_function

import django
import gzip
import os
import shutil

from argparse import ArgumentParser
from django.http import Http404

from django.core.urlresolvers import resolve
from django.test import RequestFactory

from stackviz.parser import tempest_subunit
from stackviz import settings


EXPORT_PATHS = [
    '/index.html',
    '/tempest_aggregate.html'
]


_base = os.path.dirname(os.path.abspath(__file__))


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

    try:
        content = fake_render_view(path).content

        with open_func(os.path.join(dest_dir, dest_file), 'wb') as f:
            f.write(content)
    except Http404 as ex:
        print("Warning: skipping %s due to error: %s" % (path, ex.message))


def init_django(args):
    # remove leading / from static URL to give them correct filesystem paths
    settings.STATIC_URL = settings.STATIC_URL[1:]
    settings.USE_GZIP = args.gzip
    settings.OFFLINE = True

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
        if not os.listdir(os.path.join(_base, 'static', 'components')):
            print("Bower components have not been installed, please run "
                  "`bower install`")
            return 1

    if os.path.exists(args.path):
        if os.listdir(args.path):
            print("Destination exists and is not empty, cannot continue")
            return 1
    else:
        os.mkdir(args.path)

    init_django(args)

    print("Copying static files ...")
    shutil.copytree(os.path.join(_base, 'static'),
                    os.path.join(args.path, 'static'))

    for path in EXPORT_PATHS:
        print("Rendering:", path)
        export_single_page(path, args.path)

    repos = tempest_subunit.get_repositories()
    if repos:
        for run_id in range(repos[0].count()):
            print("Rendering views for tempest run #%d" % (run_id))
            export_single_page('/tempest_timeline_%d.html' % run_id, args.path)
            export_single_page('/tempest_results_%d.html' % run_id, args.path)

            print("Exporting data for tempest run #%d" % (run_id))
            export_single_page('/tempest_api_tree_%d.json' % run_id,
                               args.path, args.gzip)
            export_single_page('/tempest_api_raw_%d.json' % run_id,
                               args.path, args.gzip)
            export_single_page('/tempest_api_details_%d.json' % run_id,
                               args.path, args.gzip)
    else:
        print("Warning: no test repository could be loaded, no data will "
              "be available!")

    print("Exporting DStat log: dstat_log.csv")
    export_single_page('/dstat_log.csv', args.path, args.gzip)


if __name__ == '__main__':
    main()
