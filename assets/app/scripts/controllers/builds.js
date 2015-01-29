'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:BuildsController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('BuildsController', function ($scope, DataService, $filter, LabelFilter) {
    $scope.builds = {};
    $scope.unfilteredBuilds = {};
    $scope.labelSuggestions = {};

    var buildsCallback = function(builds) {
      $scope.$apply(function() {
        $scope.unfilteredBuilds = builds.by("metadata.name");
        LabelFilter.createLabelSuggestionsFromResources($scope.unfilteredBuilds, $scope.labelSuggestions);
        LabelFilter.setLabelSuggestions($scope.labelSuggestions);
        $scope.builds = LabelFilter.filterResources($scope.unfilteredBuilds);
      });

      console.log("builds (subscribe)", $scope.unfilteredBuilds);
    };
    $scope.watches.push(DataService.watch("builds", $scope, buildsCallback));    

    LabelFilter.onActiveFiltersChanged(function(activeFilters) {
      // trigger a digest loop
      $scope.$apply(function() {
        $scope.builds = LabelFilter.filterResources($scope.unfilteredBuilds);
      });
    });    
  });