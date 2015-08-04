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

from subunit2sql.db import api, models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.state import InstanceState
from restless.views import Endpoint

import json

def _get_runs(change_id):
    '''
    When given the change_id of a Gerrit change, a connection will be made to
    the upstream subunit2sql db and query all run meta having that change_id
    :param change_id: the Gerrit change_id to query
    :return: a json dict of run_meta objects
    '''
    engine=create_engine('mysql://query:query@logstash.openstack.org:3306/subunit2sql')

    Session = sessionmaker(bind=engine)

    # create a Session
    session = Session()

    list_of_runs = api.get_runs_by_key_value(key="build_change",value=change_id,
                                     session=session)
    ret_list = []

    for run in list_of_runs:
        ret_list.append(run.to_dict())

    return ret_list


class GerritURLEndpoint(Endpoint):

    def get(self, request, change_id):
        '''
        :param request:
        :param change_id:
        :return: Collection of run objects associated with a
                 specific CID
        '''
        return _get_runs(change_id)
