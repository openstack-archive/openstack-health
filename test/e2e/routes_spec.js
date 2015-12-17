/*global browser */

'use strict';

var mock = require('protractor-http-mock');

describe('E2E: Routes', function() {

  it('should have a working home route', function() {
    mock(['config', 'home_project']);

    browser.get('#/');

    // route should be defined (will redirect to / if not)
    expect(browser.getLocationAbsUrl()).toMatch('/');

    // data should actually be requested (no request if error)
    expect(mock.requestsMade()).toContain(jasmine.objectContaining({
      url: 'http://localhost:5000/runs/group_by/project',
      method: 'JSONP'
    }));

    // should have a link to the next page
    var selector = 'a[href="#/g/project/openstack%252Ftaskflow"]';
    expect(element(by.css(selector)).isPresent()).toBe(true);
  });

  it('should have a working group route', function() {
    mock(['config', 'group']);

    browser.get('#/g/project/openstack%252Ftaskflow');

    // route should be defined (will redirect to / if not)
    browser.getLocationAbsUrl().then(function(url) {
      // note: phantomjs converts the octal escape to '/' for getLocationAbsUrl
      // for browsers that don't do this (chrome, firefox, etc), escape it
      // manually to make sure the expectation works correctly
      expect(url.replace('%252F', '/')).toMatch('/g/project/openstack/taskflow');
    });

    // data should actually be requested (no request if error)
    expect(mock.requestsMade()).toContain(jasmine.objectContaining({
      url: 'http://localhost:5000/runs/key/project/openstack/taskflow',
      method: 'JSONP'
    }));

    // should have a link to the next page
    var selector = 'a[href="#/job/gate-tempest-dsvm-neutron-src-taskflow"]';
    expect(element(by.css(selector)).isPresent()).toBe(true);
  });

  it('should have a single test route', function() {
    mock(['config', 'test_project']);

    browser.get('#/test/tempest.api.volume.test_qos.QosSpecsV2TestJSON.test_get_qos');

    // route should be defined (will redirect to / if not)
    expect(browser.getLocationAbsUrl()).toMatch('/test/tempest.api.volume.' +
      'test_qos.QosSpecsV2TestJSON.test_get_qos');
    // data should actually be requested (no request if error)
    expect(mock.requestsMade()).toContain(jasmine.objectContaining({
      url: 'http://localhost:5000/test_runs/tempest.api.volume.test_qos.' +
        'QosSpecsV2TestJSON.test_get_qos',
      method: 'JSONP'
    }));
  });
  afterEach(function() {
    mock.teardown();
  });
});
