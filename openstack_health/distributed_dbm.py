# Copyright 2016 Hewlett-Packard Development Company, L.P.
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


from dogpile.cache.backends import memcached
from dogpile.cache import proxy
from dogpile import util
from dogpile.util import compat
from pymemcache.client import base


class MemcachedLockedDBMProxy(proxy.ProxyBackend):

    def __init__(self, url, port=11211, lock_timeout=0):
        super(MemcachedLockedDBMProxy, self).__init__()
        self.lock_timeout = lock_timeout
        self.url = url
        self.port = port

    @util.memoized_property
    def _clients(self):
        backend = self

        class ClientPool(compat.threading.local):
            def __init__(self):
                self.memcached = backend._create_client()

        return ClientPool()

    @property
    def client(self):
        """Return the memcached client.

        This uses a threading.local by
        default as it appears most modern
        memcached libs aren't inherently
        threadsafe.

        """
        return self._clients.memcached

    def _create_client(self):
        return base.Client((self.url, self.port))

    def get_mutex(self, key):
        return memcached.MemcachedLock(lambda: self.client, key,
                                       timeout=self.lock_timeout)
