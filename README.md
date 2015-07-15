StackViz
========

A visualization utility to help analyze the performance of DevStack setup and
Tempest executions.

Installation
------------
Installation of the frontend requires Node.js and Bower. On Ubuntu:

```bash
sudo apt-get install nodejs npm
sudo npm install -g bower
```

Then, install the Bower components by running, from the project directory,

```bash
bower install
```

Usage
-----
First, install the necessary dependencies with Pip:

```bash
sudo pip install -r requirements.txt
```

The Django development server may then be used to view the interface. Run:

```bash
python manage.py runserver
```

You can then browse to the printed URL in your browser of choice.

Log Locations
-------------
Log locations are configured along with normal Django settings in
`stackviz/settings.py`. Several different types of logs are rendered by
StackViz:

 * Tempest (`testr` repositories): `./`, `/opt/stack/tempest/`
 * DevStack: *TODO*
 * Dstat: *TODO*
