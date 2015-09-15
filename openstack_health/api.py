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
import sys

import flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from subunit2sql.db import api

app = flask.Flask(__name__)
engine = None
Session = None


@app.route('/build_name/<string:build_name>/runs', methods=['GET'])
def get_runs_from_build_name(build_name):
    global Session
    session = Session()
    db_runs = api.get_runs_by_key_value('build_name', build_name, session)
    runs = [run.to_dict() for run in db_runs]
    return flask.jsonify({'runs': runs})


@app.route('/runs', methods=['GET'])
def get_runs():
    global Session
    session = Session()
    db_runs = api.get_all_runs(session)
    runs = [run.to_dict() for run in db_runs]
    return flask.jsonify({'runs': runs})


@app.route('/run/<string:run_id>/tests', methods=['GET'])
def get_tests_from_run(run_id):
    global Session
    session = Session()
    db_tests = api.get_tests_from_run_id(run_id, session)
    tests = [test.to_dict() for test in db_tests]
    return flask.jsonify({'tests': tests})


@app.route('/run/<string:run_id>/test_runs', methods=['GET'])
def get_run_test_runs(run_id):
    global Session
    session = Session()
    db_test_runs = api.get_tests_run_dicts_from_run_id(run_id, session)
    return flask.jsonift(db_test_runs)


@app.route('/tests', methods=['GET'])
def get_tests():
    global Session
    session = Session()
    db_tests = api.get_all_tests(session)
    tests = [test.to_dict() for test in db_tests]
    return flask.jsonify({'tests': tests})


@app.route('/test_runs', methods=['GET'])
def get_test_runs():
    global Session
    session = Session()
    db_test_runs = api.get_all_test_runs(session)
    test_runs = [test_run.to_dict() for test_run in db_test_runs]
    return flask.jsonify({'test_runs': test_runs})


def main():
    config = ConfigParser.ConfigParser()
    config.read(sys.argv[1])
    global engine
    engine = create_engine(config.get('default', 'db_uri'))
    global Session
    Session = sessionmaker(bind=engine)
    app.run(debug=True)


if __name__ == '__main__':
    main()
