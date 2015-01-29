'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:ServicesController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('ServicesController', function ($scope, DataService, $filter, LabelFilter) {
    $scope.services = {};
    $scope.unfilteredServices = {};
    $scope.labelSuggestions = {};

    var servicesCallback = function(services) {
      $scope.$apply(function() {
        $scope.unfilteredServices = services.by("metadata.name");
        LabelFilter.createLabelSuggestionsFromResources($scope.unfilteredServices, $scope.labelSuggestions);
        LabelFilter.setLabelSuggestions($scope.labelSuggestions);
        $scope.services = LabelFilter.filterResources($scope.unfilteredServices);
      });

      console.log("services (subscribe)", $scope.unfilteredServices);
    };
    $scope.watches.push(DataService.watch("services", $scope, servicesCallback));    

    LabelFilter.onActiveFiltersChanged(function(activeFilters) {
      // trigger a digest loop
      $scope.$apply(function() {
        $scope.services = LabelFilter.filterResources($scope.unfilteredServices);
      });
    });    
  });