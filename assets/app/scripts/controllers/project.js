'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:ProjectController
 * @description
 * # ProjectController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('ProjectController', function ($scope, $routeParams, DataService, $filter, LabelFilter) {
    $scope.projectName = $routeParams.project;
    $scope.project = {};
    $scope.projectPromise = $.Deferred();
    $scope.projects = {};
    $scope.watches = [];

    var projectCallback = function(project) {
      $scope.$apply(function(){
        $scope.project = project;
        $scope.projectPromise.resolve(project);
      });
    };

    DataService.get("projects", $scope.projectName, $scope, projectCallback);

    var projectsCallback = function(projects) {
      $scope.$apply(function(){
        $scope.projects = projects.by("metadata.name");
      });

      console.log("projects", $scope.projects);
    };
    
    DataService.list("projects", $scope, projectsCallback);

    $scope.$on('$destroy', function(){
      for (var i = 0; i < $scope.watches.length; i++) {
        DataService.unwatch($scope.watches[i]);
      }
    });    
  });
