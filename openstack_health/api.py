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


@app.route('/runs', methods=['GET'])
def get_runs():
    global Session
    session = Session()
    db_runs = api.get_all_runs(session)
    runs = [run.to_dict() for run in db_runs]
    return flask.jsonify({'runs': runs})


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
