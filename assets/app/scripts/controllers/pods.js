'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:PodsController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('PodsController', function ($scope, DataService, $filter, LabelFilter) {
    $scope.pods = {};
    $scope.unfilteredPods = {};
    $scope.images = {};
    $scope.imagesByDockerReference = {};
    $scope.builds = {};    
    $scope.labelSuggestions = {};

    var podsCallback = function(pods) {
      $scope.$apply(function() {
        $scope.unfilteredPods = pods.by("metadata.name");
        LabelFilter.createLabelSuggestionsFromResources($scope.unfilteredPods, $scope.labelSuggestions);
        LabelFilter.setLabelSuggestions($scope.labelSuggestions);
        $scope.pods = LabelFilter.filterResources($scope.unfilteredPods);
      });

      console.log("pods (subscribe)", $scope.unfilteredPods);
    };
    $scope.watches.push(DataService.watch("pods", $scope, podsCallback));    


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
        $scope.pods = LabelFilter.filterResources($scope.unfilteredPods);
      });
    });   
  });