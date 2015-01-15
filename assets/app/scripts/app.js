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
                     .template(function() {
                        // TODO Don't love this, would prefer if we could listen for an event that the
                        // nav was being redrawn and check HawtioNav.selected()                      
                        if (this.isSelected()) {
                          $("body").removeClass("show-drawer");
                        }
                        return '<li ng-class=\"{ active: item.isSelected() }\">\n  <a ng-href=\"{{item.href()}}\" ng-click=\"item.click($event)\"><span class=\"fa fa-dashboard fa-fw\"></span> {{item.title()}}</a>\n</li>\n';
                      })
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
                      .template(function() {
                        // TODO Don't love this, would prefer if we could listen for an event that the
                        // nav was being redrawn and check HawtioNav.selected()
                        if (this.isSelected()) {
                          $("body").addClass("show-drawer");
                        }
                        return '<li ng-class=\"{ active: item.isSelected() }\">\n  <a ng-href=\"{{item.href()}}\" ng-click=\"item.click($event);\"><span class=\"fa fa-sitemap fa-fw\"></span> {{item.title()}}</a><div ng-if=\"item.isSelected()\"  class=\"sidenav-secondary\"><h2 class=\"hidden-xs\">{{item.title()}}</h2><ul class=\"nav navbar-sidenav-secondary\" hawtio-sub-tabs></ul></div>\n</li>\n';
                      })
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
                      .subPath("Builds", "builds", builder.join(templatePath, 'builds.html'))
                      .subPath("Deployments", "deployments", builder.join(templatePath, 'deployments.html'))
                      .subPath("Images", "images", builder.join(templatePath, 'images.html'))
                      .subPath("Pods", "pods", builder.join(templatePath, 'pods.html'))
                      .subPath("Services", "services", builder.join(templatePath, 'services.html'))
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
        templateUrl: 'views/builds.html'
      })      
      .when('/project/:project/browse/deployments', {
        templateUrl: 'views/deployments.html'
      })            
      .when('/project/:project/browse/images', {
        templateUrl: 'views/images.html'
      })      
      .when('/project/:project/browse/pods', {
        templateUrl: 'views/pods.html'
      }) 
      .when('/project/:project/browse/services', {
        templateUrl: 'views/services.html'
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