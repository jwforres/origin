'use strict';

/**
 * @ngdoc overview
 * @name openshiftConsole
 * @description
 * # openshiftConsole
 *
 * Main module of the application.
 */
var OPENSHIFT_BUILT_TABS = [];
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
    var template = function() {
      // TODO Don't love this, would prefer if we could listen for an event that the
      // nav was being redrawn and check HawtioNav.selected()
      if (this.isSelected()) {
        if (this.tabs && this.tabs.length > 0) {
          $("body").addClass("show-drawer");
        }
        else {
          $("body").removeClass("show-drawer");
        }
      }
      return "<sidebar-nav-item></sidebar-nav-item>";        
    };

    var projectHref = function(path) {
      return function() {
        var injector = HawtioCore.injector;
        if (injector) {
          var routeParams = injector.get("$routeParams");
          if (routeParams.project) {
            return "/project/" + routeParams.project + "/" + path;
          }
        }
        return "/project/:project/" + path; 
      }
    };

    var templatePath = "views";
    var pluginName = "openshiftConsole";
    var tab = builder.create()
     .id(builder.join(pluginName, "overview"))
     .title(function () { return "Overview"; })
     .template(template)
     .href(projectHref("overview"))
      .page(function () { return builder.join(templatePath, 'project.html'); })                     
     .build();
    tab.icon = "dashboard";
    OPENSHIFT_BUILT_TABS.push(tab);

    tab = builder.create()
      .id(builder.join(pluginName, "browse"))
      .title(function () { return "Browse"; })
      .template(template)
      .href(projectHref("browse"))
      .subPath("Builds", "builds", builder.join(templatePath, 'builds.html'))
      .subPath("Deployments", "deployments", builder.join(templatePath, 'deployments.html'))
      .subPath("Images", "images", builder.join(templatePath, 'images.html'))
      .subPath("Pods", "pods", builder.join(templatePath, 'pods.html'))
      .subPath("Services", "services", builder.join(templatePath, 'services.html'))
      .build();
    tab.icon = "sitemap";
    OPENSHIFT_BUILT_TABS.push(tab);
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
  .run(["HawtioNav", function (HawtioNav) {
    for (var i = 0; i < OPENSHIFT_BUILT_TABS.length; i++) {
      HawtioNav.add(OPENSHIFT_BUILT_TABS[i]);
    }
  }]);

hawtioPluginLoader.addModule('openshiftConsole');