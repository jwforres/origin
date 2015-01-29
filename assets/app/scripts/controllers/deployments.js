'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:DeploymentsController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('DeploymentsController', function ($scope, DataService, $filter, LabelFilter) {
    $scope.deployments = {};
    $scope.unfilteredDeployments = {};
    $scope.images = {};
    $scope.imagesByDockerReference = {};
    $scope.builds = {};
    $scope.labelSuggestions = {};

    var deploymentsCallback = function(deployments) {
      $scope.$apply(function() {
        $scope.unfilteredDeployments = deployments.by("metadata.name");
        LabelFilter.createLabelSuggestionsFromResources($scope.unfilteredDeployments, $scope.labelSuggestions);
        LabelFilter.setLabelSuggestions($scope.labelSuggestions);
        $scope.deployments = LabelFilter.filterResources($scope.unfilteredDeployments);
      });

      console.log("deployments (subscribe)", $scope.deployments);
    };
    $scope.watches.push(DataService.watch("replicationControllers", $scope, deploymentsCallback));    


    // Also load images and builds to fill out details in the pod template
    var imagesCallback = function(images) {
      $scope.$apply(function() {
        $scope.images = images.by("metadata.name");
        $scope.imagesByDockerReference = images.by("dockerImageReference");
      });
      
      console.log("images (subscribe)", $scope.images);
      console.log("imagesByDockerReference (subscribe)", $scope.imagesByDockerReference);
    };
    $scope.watches.push(DataService.watch("images", $scope, imagesCallback));    

    var buildsCallback = function(builds) {
      $scope.$apply(function() {
        $scope.builds = builds.by("metadata.name");
      });

      console.log("builds (subscribe)", $scope.builds);
    };
    $scope.watches.push(DataService.watch("builds", $scope, buildsCallback));  

    LabelFilter.onActiveFiltersChanged(function(activeFilters) {
      // trigger a digest loop
      $scope.$apply(function() {
        $scope.deployments = LabelFilter.filterResources($scope.unfilteredDeployments);
      });
    });       
  });