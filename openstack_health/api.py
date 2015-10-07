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

import flask
from flask import abort
from flask.ext.jsonpify import jsonify
from flask import make_response
from operator import itemgetter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from subunit2sql.db import api


app = flask.Flask(__name__)
engine = None
Session = None


@app.before_first_request
def setup():
    config = ConfigParser.ConfigParser()
    config.read(sys.argv[1])
    global engine
    engine = create_engine(config.get('default', 'db_uri'))
    global Session
    Session = sessionmaker(bind=engine)


@app.route('/build_name/<string:build_name>/runs', methods=['GET'])
def get_runs_from_build_name(build_name):
    global Session
    session = Session()
    db_runs = api.get_runs_by_key_value('build_name', build_name, session)
    runs = [run.to_dict() for run in db_runs]
    return jsonify({'runs': runs})


def _filter_by_date_res(date_res, sec_runs):
    runs = {}
    for run in sec_runs:
        # Filter resolution
        if date_res == 'min':
            corr_res = run.replace(second=0, microsecond=0)
        elif date_res == 'hour':
            corr_res = run.replace(minute=0, second=0, microsecond=0)
        elif date_res == 'day':
            corr_res = run.date()
        # Build runs dict with correct resolution
        if corr_res in runs:
            for local_run in sec_runs[run]:
                if runs[corr_res].get(local_run, None):
                    runs[corr_res][local_run].extend(
                        sec_runs[run][local_run])
                else:
                    runs[corr_res][
                        local_run] = sec_runs[run][local_run]
        else:
            runs[corr_res] = sec_runs[run]
    return runs


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
    date_range = flask.request.args.get('datetime_resolution', None)
    sec_runs = api.get_all_runs_time_series_by_key(key, start_date,
                                                   stop_date, session)
    if not date_range:
        runs = sec_runs
    else:
        runs = {}
        if date_range not in ['sec', 'min', 'hour', 'day']:
            return ('Datetime resolution: %s, is not a valid'
                    ' choice' % date_range), 400
        elif date_range != 'sec':
            runs = _filter_by_date_res(date_range, sec_runs)
        else:
            runs = sec_runs
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
                                       date_range=None):
    if date_range not in ['sec', 'min', 'hour', 'day']:
        return ('Datetime resolution: %s, is not a valid'
                ' choice' % date_range), 400

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
    if date_range != 'sec':
        runs_by_groupby_key = _filter_by_date_res(date_range,
                                                  runs_by_groupby_key)

    out_runs = {}
    for run in runs_by_groupby_key:
        out_runs[run.isoformat()] = runs_by_groupby_key[run]

    return out_runs, 200


@app.route('/runs', methods=['GET'])
def get_runs():
    global Session
    session = Session()
    # TODO(andreaf) If dates are not valid, they will simply be ignored by the
    # db_api. We may want validation here to return a warning to the user
    start_date = flask.request.args.get('start_date', None)
    stop_date = flask.request.args.get('stop_date', None)
    db_runs = api.get_all_runs_by_date(start_date, stop_date, session)
    runs = [run.to_dict() for run in db_runs]
    return jsonify({'runs': runs})


def _calc_amount_of_successful_runs(runs):
    """
    Calculates the amount of successful runs.
    If there were any failures, then the whole run failed.
    If there were no failures, then the whole run succeeded.
    """
    was_run_successful = lambda x: 1 if x['fail'] == 0 else 0
    successful_runs = map(was_run_successful, runs)
    return sum(successful_runs)


def _calc_amount_of_failed_runs(runs, amount_of_success_runs):
    """
    Calculates the amount of failed runs.
    It simply subtracts the amount of runs by the amount of successful ones.
    """
    total_runs = len(runs)
    return total_runs - amount_of_success_runs


def _aggregate_runs(runs_by_time_delta):
    aggregated_runs = []
    for time in runs_by_time_delta:
        runs_by_job_name = runs_by_time_delta[time]
        job_data = []
        for job_name in runs_by_job_name:
            runs = runs_by_job_name[job_name]
            amount_of_success = _calc_amount_of_successful_runs(runs)
            amount_of_failures = _calc_amount_of_failed_runs(runs,
                                                             amount_of_success)
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
    start_date = flask.request.args.get('start_date', None)
    stop_date = flask.request.args.get('stop_date', None)
    date_range = flask.request.args.get('datetime_resolution', 'day')

    filter_by_project = "project"
    group_by_build_name = "build_name"
    runs_by_time, err = _get_runs_for_key_value_grouped_by(filter_by_project,
                                                           project,
                                                           group_by_build_name,
                                                           start_date,
                                                           stop_date,
                                                           date_range)

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


def main():
    app.run(debug=True)


if __name__ == '__main__':
    main()
