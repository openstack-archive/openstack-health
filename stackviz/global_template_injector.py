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

from stackviz.parser.tempest_subunit import get_providers
from stackviz.settings import OFFLINE
from stackviz.settings import USE_GZIP


def inject_extra_context(request):
    ret = {
        'use_gzip': USE_GZIP,
        'offline': OFFLINE
    }

    providers = get_providers()
    if providers:
        default = providers.values()[0]

        ret.update({
            'tempest_providers': providers.values(),
            'tempest_default_provider': default,
        })

    return ret
