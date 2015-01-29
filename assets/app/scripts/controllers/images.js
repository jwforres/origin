'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:ImagesController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('ImagesController', function ($scope, DataService, $filter, LabelFilter) {
    $scope.images = {};
    $scope.unfilteredImages = {};
    $scope.builds = {};
    $scope.labelSuggestions = {};

    var imagesCallback = function(images) {
      $scope.$apply(function() {
        $scope.unfilteredImages = images.by("metadata.name");
        LabelFilter.createLabelSuggestionsFromResources($scope.unfilteredImages, $scope.labelSuggestions);
        LabelFilter.setLabelSuggestions($scope.labelSuggestions);
        $scope.images = LabelFilter.filterResources($scope.unfilteredImages);
      });

      console.log("images (subscribe)", $scope.images);
    };
    $scope.watches.push(DataService.watch("images", $scope, imagesCallback));    

    // Also load builds so we can link out to builds associated with images
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
        $scope.images = LabelFilter.filterResources($scope.unfilteredImages);
      });
    });  
  });