StackViz
========

A visualization utility to help analyze the performance of DevStack setup and Tempest executions.

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
````

Usage
-----
The Django development server can be used to view the interface. Run:

```bash
python manage.py runserver
```

You can then browse to the printed URL in your browser of choice.