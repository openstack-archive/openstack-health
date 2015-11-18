describe('PageTitleService', function() {
  beforeEach(function() {
    module('app');
    module('app.services');
  });

  var $rootScope, pageTitleService;

  beforeEach(inject(function(_$rootScope_, _pageTitleService_) {
    $rootScope = _$rootScope_;
    pageTitleService = _pageTitleService_;
  }));

  it('should update page title', function() {
    var newPageTitle = 'new page title';
    pageTitleService.update(newPageTitle);

    var expectedPageTitle = 'New page title — OpenStack Health';
    expect($rootScope.pageTitle).toEqual(expectedPageTitle);
  });
});
