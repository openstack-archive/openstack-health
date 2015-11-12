module.exports = {
  request: {
    method: 'JSONP',
    path: '/project/openstack/taskflow/runs'
  },
  response: {
    data: {
      "timedelta": [
        {
          "datetime": "2015-10-23T20:00:00",
          "job_data": [
            {
              "fail": 0,
              "job_name": "gate-tempest-dsvm-neutron-src-taskflow",
              "mean_run_time": 4859.3,
              "pass": 1
            }
          ]
        },
        {
          "datetime": "2015-11-10T23:00:00",
          "job_data": [
            {
              "fail": 0,
              "job_name": "gate-tempest-dsvm-neutron-src-taskflow",
              "mean_run_time": 6231.47,
              "pass": 1
            }
          ]
        }
      ]
    }
  }
};
