"use strict";

angular.module("openshiftConsole")
  .directive("runDockerImage", function($filter,
                                        $q,
                                        $window,
                                        ApplicationGenerator,
                                        DataService,
                                        DockerImageGeneratorService,
                                        Navigate,
                                        ProjectsService,
                                        TaskList) {
    return {
      restrict: 'E',
      scope: {
        project: '=',
        context: '=',
        alerts: '='
      },
      templateUrl: 'views/directives/run-docker-image.html',
      link: function($scope) {
        $scope.app = {
          env: {},
          labels: {}
        };

        var stripTag = $filter('stripTag');
        var humanizeKind = $filter('humanizeKind');

        // Change image names like "openshift/hello-openshift:latest" to "hello-openshift", which can be used as an app name.
        var getName = function() {
          // Remove everything through the last '/'.
          var nameAndTag = _.last($scope.import.name.split('/'));
          return stripTag(nameAndTag);
        };

        function getResources() {
          return DockerImageGeneratorService.getResources({
            name: $scope.app.name,
            image: $scope.import.name,
            tag: $scope.import.tag,
            ports: $scope.ports,
            volumes: $scope.volumes,
            env: $scope.app.env,
            labels: $scope.app.labels
          });
        }

        $scope.findImage = function() {
          $scope.loading = true;
          DockerImageGeneratorService.findImage($scope.imageName, $scope.context)
            .then(
              // success
              function(response) {
                $scope.loading = false;
                $scope.import = response;
                var image = $scope.import.image;
                if (image) {
                  $scope.app.name = getName();
                  $scope.app.labels = {
                    app: $scope.app.name
                  };
                  $scope.runsAsRoot = DockerImageGeneratorService.runsAsRoot(image);
                  $scope.ports = ApplicationGenerator.parsePorts(image);
                  $scope.volumes = DockerImageGeneratorService.getVolumes(image);
                }
              },
              // failure
              function(response) {
                $scope.loading = false;
                $scope.alerts['import-image'] = {
                  type: "error",
                  message: "An error occurred finding the image.",
                  details: $filter('getErrorDetails')(response)
                };
              });
          };

          $scope.$watch('app.name', function() {
            _.set($scope, 'app.labels.app', $scope.app.name);
          });

          $scope.create = function() {
            var resources = getResources();
            var titles = {
              started: "Deploying image " + $scope.import.imageName + " in project " + $scope.project,
              success: "Deployed image " + $scope.import.imageName + " in project " + $scope.project,
              failure: "Failed to deploy image " + $scope.import.imageName + " in project " + $scope.project
            };
            TaskList.clear();
            TaskList.add(titles, {}, function() {
              var d = $q.defer();
              DataService.createList(resources, $scope.context).then(function(result) {
                var alerts, hasErrors = !_.isEmpty(result.failure);
                if (hasErrors) {
                  // Show failure alerts.
                  alerts = _.map(result.failure, function(failure) {
                    return {
                      type: "error",
                      message: "Cannot create " + humanizeKind(failure.object.kind).toLowerCase() + " \"" + failure.object.metadata.name + "\". ",
                      details: failure.data.message
                    };
                  });
                  // Show success alerts.
                  alerts = alerts.concat(_.map(result.success, function(success) {
                    return {
                      type: "success",
                      message: "Created " + humanizeKind(success.kind).toLowerCase() + " \"" + success.metadata.name + "\" successfully. "
                    };
                  }));
                } else {
                  // Only show one success message when everything worked.
                  alerts = [{
                    type: "success",
                    message: "All resources for image " + $scope.import.imageName + " were created successfully."
                  }];
                }
                d.resolve({alerts: alerts, hasErrors: hasErrors});
              });

              return d.promise;
            });
            Navigate.toNextSteps($scope.app.name, $scope.project);
          };
      }
    };
  });
