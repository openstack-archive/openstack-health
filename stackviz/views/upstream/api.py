from subunit2sql.db import api
from subunit2sql import shell

def main():
    # Initialize subunit2sql config
    shell.parse_args([])
    db_uri = 'mysql://query:query@logstash.openstack.org:3306/subunit2sql'
    shell.CONF.set_override('connection', db_uri, group='database')
    latest_run = api.get_latest_run()
    print latest_run.id
    print latest_run.run_time

if __name__ == '__main__':
    main()