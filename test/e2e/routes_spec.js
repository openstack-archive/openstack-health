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
    var selector = 'a[href="#/project/openstack%252Ftaskflow"]';
    expect(element(by.css(selector)).isPresent()).toBe(true);
  });

  it('should have a working group route', function() {
    mock(['config', 'group']);

    browser.get('#/project/openstack%252Ftaskflow');

    // route should be defined (will redirect to / if not)
    browser.getLocationAbsUrl().then(function(url) {
      // note: phantomjs converts the octal escape to '/' for getLocationAbsUrl
      // for browsers that don't do this (chrome, firefox, etc), escape it
      // manually to make sure the expectation works correctly
      expect(url.replace('%252F', '/')).toMatch('/project/openstack/taskflow');
    });

    // data should actually be requested (no request if error)
    expect(mock.requestsMade()).toContain(jasmine.objectContaining({
      url: 'http://localhost:5000/project/openstack/taskflow/runs',
      method: 'JSONP'
    }));

    // should have a link to the next page
    var selector = 'a[href="#/job/gate-tempest-dsvm-neutron-src-taskflow"]';
    expect(element(by.css(selector)).isPresent()).toBe(true);
  });

  afterEach(function() {
    mock.teardown();
  });

});
