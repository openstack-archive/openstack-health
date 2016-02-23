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


import argparse
import ConfigParser
from dateutil import parser as date_parser
import itertools
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
import test_run_aggregator

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


def get_session():
    global Session
    if not Session:
        setup()
    return Session()


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
    session = get_session()
    db_runs = api.get_runs_by_key_value('build_name', build_name, session)
    runs = [run.to_dict() for run in db_runs]
    return jsonify({'runs': runs})


@app.route('/runs/metadata/keys', methods=['GET'])
def get_run_metadata_keys():
    global config
    try:
        if config:
            ignored_keys = (config
                            .get('default', 'ignored_run_metadata_keys')
                            .splitlines())
        else:
            ignored_keys = []
    except ConfigParser.NoOptionError:
        ignored_keys = []

    session = get_session()
    existing_keys = set(api.get_all_run_metadata_keys(session))
    allowed_keys = existing_keys.difference(ignored_keys)

    return jsonify(list(allowed_keys))


def _parse_datetimes(datetime_str):
    if datetime_str:
        return date_parser.parse(datetime_str)
    else:
        return datetime_str


@app.route('/runs/group_by/<string:key>', methods=['GET'])
def get_runs_grouped_by_metadata_per_datetime(key):
    session = get_session()
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', 'sec')
    sec_runs = api.get_all_runs_time_series_by_key(key, start_date,
                                                   stop_date, session)

    if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
        return ('Datetime resolution: %s, is not a valid'
                ' choice' % datetime_resolution), 400

    runs = RunAggregator(sec_runs).aggregate(datetime_resolution)

    return jsonify({'runs': runs})


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


@app.route('/build_name/<string:build_name>/test_runs', methods=['GET'])
def get_test_runs_by_build_name(build_name):
    session = get_session()
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
    tests = test_run_aggregator.TestRunAggregator(tests).aggregate(
        datetime_resolution=datetime_resolution)
    return jsonify({'tests': tests})


@app.route('/runs', methods=['GET'])
def get_runs():
    session = get_session()
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


@app.route('/runs/key/<path:run_metadata_key>/<path:value>', methods=['GET'])
def get_runs_by_run_metadata_key(run_metadata_key, value):
    session = get_session()

    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', 'day')

    if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
        message = ('Datetime resolution: %s, is not a valid'
                   ' choice' % datetime_resolution)
        status_code = 400
        return abort(make_response(message, status_code))

    runs = (api.get_time_series_runs_by_key_value(run_metadata_key,
                                                  value,
                                                  start_date,
                                                  stop_date,
                                                  session))
    # Groups runs by metadata
    group_by = "build_name"
    runs_by_build_name = _group_runs_by_key(runs, group_by)

    # Group runs by the chosen data_range.
    # That does not apply when you choose 'sec' since runs are already grouped
    # by it.
    aggregated_runs = \
        RunAggregator(runs_by_build_name).aggregate(datetime_resolution)

    return jsonify(_aggregate_runs(aggregated_runs))


@app.route('/runs/key/<path:run_metadata_key>/<path:value>/recent',
           methods=['GET'])
def get_recent_runs(run_metadata_key, value):
    session = get_session()

    num_runs = flask.request.args.get('num_runs', 10)
    results = api.get_recent_runs_by_key_value_metadata(
        run_metadata_key, value, num_runs, session)
    runs = []
    for result in results:
        if result.passes > 0 and result.fails == 0:
            status = 'success'
        elif result.fails > 0:
            status = 'fail'
        else:
            continue

        run = {
            'id': result.uuid,
            'status': status,
            'start_date': result.run_at.isoformat(),
            'link': result.artifacts,
        }

        run_meta = api.get_run_metadata(result.uuid, session)
        for meta in run_meta:
            if meta.key == 'build_name':
                run['build_name'] = meta.value
                break
        runs.append(run)
    return jsonify(runs)


@app.route('/tests/recent/<string:status>', methods=['GET'])
def get_recent_test_status(status):
    session = get_session()
    num_runs = flask.request.args.get('num_runs', 10)
    failed_runs = api.get_recent_failed_runs(num_runs, session)
    test_runs = api.get_test_runs_by_status_for_run_ids(status, failed_runs,
                                                        session=session)
    output = []
    for run in test_runs:
        run['start_time'] = run['start_time'].isoformat()
        run['stop_time'] = run['stop_time'].isoformat()
        output.append(run)
    return jsonify(output)


@app.route('/run/<string:run_id>/tests', methods=['GET'])
def get_tests_from_run(run_id):
    session = get_session()
    db_tests = api.get_tests_from_run_id(run_id, session)
    tests = [test.to_dict() for test in db_tests]
    return jsonify({'tests': tests})


@app.route('/run/<string:run_id>/test_runs', methods=['GET'])
def get_run_test_runs(run_id):
    session = get_session()
    db_test_runs = api.get_tests_run_dicts_from_run_id(run_id, session)
    return jsonify(db_test_runs)


@app.route('/tests', methods=['GET'])
def get_tests():
    session = get_session()
    db_tests = api.get_all_tests(session)
    tests = [test.to_dict() for test in db_tests]
    return jsonify({'tests': tests})


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


def parse_command_line_args():
    description = 'Starts the API service for openstack-health'
    parser = argparse.ArgumentParser(description=description)

    parser.add_argument('config_file', type=str,
                        help='the path for the config file to be read.')
    return parser.parse_args()


@app.route('/test_runs/<string:test_id>', methods=['GET'])
def get_test_runs_for_test(test_id):
    session = get_session()
    start_date = _parse_datetimes(flask.request.args.get('start_date', None))
    stop_date = _parse_datetimes(flask.request.args.get('stop_date', None))
    datetime_resolution = flask.request.args.get('datetime_resolution', 'min')

    if datetime_resolution not in ['sec', 'min', 'hour', 'day']:
        message = ('Datetime resolution: %s, is not a valid'
                   ' choice' % datetime_resolution)
        status_code = 400
        return abort(make_response(message, status_code))
    db_test_runs = api.get_test_runs_by_test_test_id(test_id, session=session,
                                                     start_date=start_date,
                                                     stop_date=stop_date)
    if not db_test_runs:
        # NOTE(mtreinish) if no data is returned from the DB just return an
        # empty set response, the test_run_aggregator function assumes data
        # is present.
        return jsonify({'numeric': {}, 'data': {}})
    test_runs = test_run_aggregator.convert_test_runs_list_to_time_series_dict(
        db_test_runs, datetime_resolution)
    return jsonify(test_runs)


def main():
    global config
    args = parse_command_line_args()
    config = ConfigParser.ConfigParser()
    config.read(args.config_file)
    app.run(debug=True)


if __name__ == '__main__':
    main()
