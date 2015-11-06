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


import ConfigParser
from dateutil import parser as date_parser
import itertools
import sys
import urllib

import flask
from flask import abort
from flask.ext.jsonpify import jsonify
from flask import make_response
from operator import itemgetter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from subunit2sql.db import api

from run_aggregator import RunAggregator
from test_run_aggregator import TestRunAggregator

app = flask.Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True
config = None
engine = None
Session = None


def get_app():
    return app


@app.before_first_request
def setup():
    global config
    if not config:
        config = ConfigParser.ConfigParser()
        config.read('/etc/openstack-health.conf')
    global engine
    db_uri = config.get('default', 'db_uri')
    try:
        pool_size = config.get('default', 'pool_size')
    except ConfigParser.NoOptionError:
        pool_size = 20
    try:
        pool_recycle = config.get('default', 'pool_recycle')
    except ConfigParser.NoOptionError:
        pool_recycle = 3600
    engine = create_engine(db_uri,
                           pool_size=pool_size,
                           pool_recycle=pool_recycle)
    global Session
    Session = sessionmaker(bind=engine)


@app.route('/', methods=['GET'])
def list_routes():
    output = []
    for rule in app.url_map.iter_rules():
        options = {}
        for arg in rule.arguments:
            options[arg] = "[{0}]".format(arg)
        url = flask.url_for(rule.endpoint, **options)
        out_dict = {
            'name': rule.endpoint,
            'methods': sorted(rule.methods),
            'url': urllib.unquote(url),
        }
        output.append(out_dict)
    return jsonify({'routes': output})


@app.route('/build_name/<string:build_name>/runs', methods=['GET'])
def get_runs_from_build_name(build_name):
    global Session
    session = Session()
    db_runs = api.get_runs_by_key_value('build_name', build_name, session)
    runs = [run.to_dict() for run in db_runs]
    return jsonify({'runs': runs})


@app.route('/runs/metadata/keys', methods=['GET'])
def get_run_metadata_keys():
    global Session
    session = Session()
    return jsonify(api.get_all_run_metadata_keys(session))


def _parse_datetimes(datetime_str):
    if datetime_str:
        return date_parser.parse(datetime_str)
    else:
        return datetime_str


@app.route('/runs/group_by/<string:key>', methods=['GET'])
def get_runs_grouped_by_metadata_per_datetime(key):
    global Session
    session = Session()
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', None)
    sec_runs = api.get_all_runs_time_series_by_key(key, start_date,
                                                   stop_date, session)
    if not datetime_resolution:
        runs = sec_runs
    else:
        runs = {}
        if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
            return ('Datetime resolution: %s, is not a valid'
                    ' choice' % datetime_resolution), 400
        else:
            runs = RunAggregator(sec_runs).aggregate(datetime_resolution)
    out_runs = {}
    for run in runs:
        out_runs[run.isoformat()] = runs[run]
    return jsonify({'runs': out_runs})


def _group_runs_by_key(runs_by_time, groupby_key):
    """
    Groups runs by a key.
    This function assumes that your runs are already grouped by time.
    """

    keyfunc = lambda c: c['metadata'][groupby_key]
    grouped_runs_by = {}
    for timestamp, runs_by_time in runs_by_time.iteritems():
        if timestamp not in grouped_runs_by:
            grouped_runs_by[timestamp] = {}
        for key, val in itertools.groupby(runs_by_time, keyfunc):
            grouped_runs_by[timestamp][key] = list(val)
    return grouped_runs_by


def _get_runs_for_key_value_grouped_by(key, value, groupby_key,
                                       start_date=None, stop_date=None,
                                       datetime_resolution=None):
    if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
        return ('Datetime resolution: %s, is not a valid'
                ' choice' % datetime_resolution), 400

    global Session
    session = Session()
    runs_by_time = api.get_time_series_runs_by_key_value(key,
                                                         value,
                                                         start_date,
                                                         stop_date,
                                                         session)
    # Groups runs by metadata
    runs_by_groupby_key = _group_runs_by_key(runs_by_time, groupby_key)

    # Group runs by the chosen data_range.
    # That does not apply when you choose 'sec' since runs are already grouped
    # by it.
    runs_by_groupby_key = (RunAggregator(runs_by_groupby_key)
                           .aggregate(datetime_resolution=datetime_resolution))
    out_runs = {}
    for run in runs_by_groupby_key:
        out_runs[run.isoformat()] = runs_by_groupby_key[run]

    return out_runs, 200


@app.route('/build_name/<string:build_name>/test_runs', methods=['GET'])
def get_test_runs_by_build_name(build_name):
    global Session
    session = Session()
    key = 'build_name'
    value = build_name
    if not key or not value:
        return 'A key and value must be specified', 400
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', 'sec')
    if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
        return ('Datetime resolution: %s, is not a valid'
                ' choice' % datetime_resolution), 400
    tests = api.get_test_run_dict_by_run_meta_key_value(key, value, start_date,
                                                        stop_date, session)
    tests = (TestRunAggregator(tests)
             .aggregate(datetime_resolution=datetime_resolution))
    return jsonify({'tests': tests})


@app.route('/runs', methods=['GET'])
def get_runs():
    global Session
    session = Session()
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    db_runs = api.get_all_runs_by_date(start_date, stop_date, session)
    runs = [run.to_dict() for run in db_runs]
    return jsonify({'runs': runs})


def _calc_amount_of_successful_runs(runs):
    """
    If there were no failures while there's any passes, then the run succeeded.
    If there's no fails and no passes, then the run did not succeeded.
    """
    was_run_successful = lambda x: 1 if x['fail'] == 0 and x['pass'] > 0 else 0
    successful_runs = map(was_run_successful, runs)
    return sum(successful_runs)


def _calc_amount_of_failed_runs(runs):
    """
    If there were any failure, then the whole run failed.
    """
    return sum((1 for r in runs if r['fail'] > 0))


def _aggregate_runs(runs_by_time_delta):
    aggregated_runs = []
    for time in runs_by_time_delta:
        runs_by_job_name = runs_by_time_delta[time]
        job_data = []
        for job_name in runs_by_job_name:
            runs = runs_by_job_name[job_name]
            amount_of_success = _calc_amount_of_successful_runs(runs)
            amount_of_failures = _calc_amount_of_failed_runs(runs)
            avg_runtime = sum(map(itemgetter('run_time'), runs)) / len(runs)
            job_data.append({'fail': amount_of_failures,
                             'pass': amount_of_success,
                             'mean_run_time': avg_runtime,
                             'job_name': job_name})
        runs_by_time = dict(datetime=time)
        runs_by_time['job_data'] = sorted(job_data, key=itemgetter('job_name'))
        aggregated_runs.append(runs_by_time)
    aggregated_runs.sort(key=itemgetter('datetime'))
    return dict(timedelta=aggregated_runs)


@app.route('/projects/<path:project>/runs', methods=['GET'])
def get_runs_by_project(project):
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', 'day')

    filter_by_project = "project"
    group_by_build_name = "build_name"
    runs_by_time, err = _get_runs_for_key_value_grouped_by(filter_by_project,
                                                           project,
                                                           group_by_build_name,
                                                           start_date,
                                                           stop_date,
                                                           datetime_resolution)

    if err != 200:
        return abort(make_response(runs_by_time, err))

    return jsonify(_aggregate_runs(runs_by_time))


@app.route('/run/<string:run_id>/tests', methods=['GET'])
def get_tests_from_run(run_id):
    global Session
    session = Session()
    db_tests = api.get_tests_from_run_id(run_id, session)
    tests = [test.to_dict() for test in db_tests]
    return jsonify({'tests': tests})


@app.route('/run/<string:run_id>/test_runs', methods=['GET'])
def get_run_test_runs(run_id):
    global Session
    session = Session()
    db_test_runs = api.get_tests_run_dicts_from_run_id(run_id, session)
    return jsonify(db_test_runs)


@app.route('/tests', methods=['GET'])
def get_tests():
    global Session
    session = Session()
    db_tests = api.get_all_tests(session)
    tests = [test.to_dict() for test in db_tests]
    return jsonify({'tests': tests})


@app.route('/test_runs', methods=['GET'])
def get_test_runs():
    global Session
    session = Session()
    db_test_runs = api.get_all_test_runs(session)
    test_runs = [test_run.to_dict() for test_run in db_test_runs]
    return jsonify({'test_runs': test_runs})


def _check_db_availability():
    try:
        global engine
        result = engine.execute('SELECT now()').first()
        if result is None:
            return False
        return True
    except Exception:
        return False


@app.route('/status', methods=['GET'])
def get_status():

    is_db_available = _check_db_availability()

    status = {'status': {'availability': {'database': is_db_available}}}
    response = jsonify(status)

    if not is_db_available:
        response.status_code = 500

    return response


def main():
    global config
    config = ConfigParser.ConfigParser()
    config.read(sys.argv[1])
    app.run(debug=True)


if __name__ == '__main__':
    main()
