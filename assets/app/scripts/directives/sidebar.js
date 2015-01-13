angular.module('openshiftConsole')
  .directive('sidebar', function() {
    return {
      restrict: 'E', 
      templateUrl: 'views/_sidebar.html'
    };
  });
