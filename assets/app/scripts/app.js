'use strict';

/**
 * @ngdoc overview
 * @name openshiftConsole
 * @description
 * # openshiftConsole
 *
 * Main module of the application.
 */
    var tab = null;
    var tab2 = null;
angular
  .module('openshiftConsole', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  // configure our tabs and routing
  .config(['$routeProvider', 'HawtioNavBuilderProvider', function($routeProvider, builder) {
        var templatePath = "views";
        var pluginName = "openshiftConsole";
        tab = builder.create()
                     .id(pluginName)
                     .title(function () { return "Overview"; })
                     .href(function () { 
                        var injector = HawtioCore.injector;
                        if (injector) {
                          var routeParams = injector.get("$routeParams");
                          if (routeParams.project) {
                            return "/project/" + routeParams.project + "/overview";
                          }
                        }
                        return "/project/:project/overview"; 
                      })
                      .page(function () { return builder.join(templatePath, 'project.html'); })                     
                     .build();

        tab2 = builder.create()
                      .id(builder.join(pluginName, '2'))
                      .title(function () { return "Browse"; })
                      .href(function () { 
                        var injector = HawtioCore.injector;
                        if (injector) {
                          var routeParams = injector.get("$routeParams");
                          if (routeParams.project) {
                            return "/project/" + routeParams.project + "/browse";
                          }
                        }
                        return "/project/:project/browse"; 
                      })
                      .subPath("Builds", "builds", builder.join(templatePath, 'pods.html'))
                      .subPath("Images", "images", builder.join(templatePath, 'pods.html'))
                      .subPath("Pods", "pods", builder.join(templatePath, 'pods.html'))                      
                      .build();
  }])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/projects.html',
        controller: 'ProjectsController'
      })
      .when('/project/:project', {
        redirectTo: function(params) {
          return '/project/' + params.project + "/overview";
        }
      })      
      .when('/project/:project/overview', {
        templateUrl: 'views/project.html'
      })
      .when('/project/:project/browse', {
        redirectTo: function(params) {
          return '/project/' + params.project + "/browse/pods";  // TODO decide what subtab to default to here
        }
      })      
      .when('/project/:project/browse/builds', {
        templateUrl: 'views/pods.html' // TODO need the right template for this
      })      
      .when('/project/:project/browse/images', {
        templateUrl: 'views/pods.html' // TODO need the right template for this
      })      
      .when('/project/:project/browse/pods', {
        templateUrl: 'views/pods.html'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(["HawtioNav", "$timeout", function (HawtioNav, $timeout) {
        //Test.log.debug('loaded');
        HawtioNav.add(tab);
        HawtioNav.add(tab2);
  }]);

hawtioPluginLoader.addModule('openshiftConsole');