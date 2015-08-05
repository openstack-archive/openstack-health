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

from restless.views import Endpoint

from subunit2sql.db import api

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _get_runs(change_id):
    """Returns the dict of run objects associated with a changeID

    When given the change_id of a Gerrit change, a connection will be made to
    the upstream subunit2sql db and query all run meta having that change_id
    :param change_id: the Gerrit change_id to query
    :return: a json dict of run_meta objects
    """

    engine = create_engine('mysql://query:query@logstash.openstack.org' +
                           ':3306/subunit2sql')
    Session = sessionmaker(bind=engine)
    session = Session()

    list_of_runs = api.get_runs_by_key_value(key="build_change",
                                             value=change_id,
                                             session=session)
    ret_list = []

    for run in list_of_runs:
        ret_list.append(run.to_dict())

    return ret_list

def _get_metadata(run_id):
    """Returns a dict of run_metadata objects associated with a run_id

    :param run_id:
    :return:
    """

    engine = create_engine('mysql://query:query@logstash.openstack.org' +
                           ':3306/subunit2sql')
    Session = sessionmaker(bind=engine)
    session = Session()

    metadata = api.get_run_metadata(run_id,session=session)
    ret_list = []

    for meta in metadata:
        ret_list.append(meta.to_dict())

    return ret_list


class GerritURLEndpoint(Endpoint):

    def get(self, request, change_id):
        return _get_runs(change_id)

class RunMetadataEndpoint(Endpoint):

    def get(self, request, run_id):
        return _get_metadata(run_id)
