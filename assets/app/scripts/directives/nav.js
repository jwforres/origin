angular.module('openshiftConsole')
  .directive('sidebar', function() {
    return {
      restrict: 'E', 
      templateUrl: 'views/_sidebar.html'
    };
  })
  .directive('projectNav', function($timeout, $location) {
    return {
      restrict: 'E',
      scope: {
        projects: '=',
        selected: '='
      },       
      templateUrl: 'views/_project-nav.html',
      link: function ($scope, element, attrs) {
        // The double timeout is a hack to guarantee DOM is finished rendering
        $timeout(function () {
          $timeout(function () {
            $('.selectpicker').selectpicker().change(function() {
              // TODO we want to keep the same sub-path we were already on and just switch projects
              $location.url("/project/" + $( this ).val());
            });
          }, 0);
        }, 0);
      }      
    };
  });
