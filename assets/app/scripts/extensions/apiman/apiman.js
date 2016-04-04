(function() {

  var pluginName = 'apimanLinks';
  var log = Logger.get(pluginName);

  var APIMANAGER_ANNOTATION = 'api.service.openshift.io/api-manager';
  var APIMAN = 'apiman';

  var APIMAN_URL = undefined;

  hawtioPluginLoader.addModule(pluginName);

  hawtioPluginLoader.registerPreBootstrapTask(function(next) {
    // TODO need to figure out apiman service discovery
    APIMAN_URL = 'https://apiman.vagrant.f8';
    next();
  });

  function createApimanUri(name, namespace) {
    var uri = new URI(APIMAN_URL);
    uri.path('apimanui/api-manager/orgs/').segment(namespace).segment('apis').segment(name);
    return uri;
  }

  var _module = angular.module(pluginName, []);

  _module.run(['AuthService', 'BaseHref', 'DataService', 'extensionRegistry', '$sce', function(AuthService, BaseHref, DataService, extensionRegistry, $sce) {
    if (!APIMAN_URL) {
      return;
    }
    $sce.trustAsResourceUrl(APIMAN_URL);

    var linkTemplate = new URITemplate([
      '#backTo={backlink}'
    ].join(''));

    var template = `
      <div>
        <a href="" ng-click="item.data.gotoApiView($event, item.data)">Manage API</a>
      </div>
    `;

    function configureData(service) {
      if (!service.metadata.annotations) {
        return undefined;
      }
      var annotation = service.metadata.annotations[APIMANAGER_ANNOTATION];
      if (!annotation || annotation !== APIMAN) {
        return undefined;
      }
      var name = service.metadata.name;
      var namespace = service.metadata.namespace;

      var gotoApiView = function($event, item) {
        // TODO this is still WIP
        var token = AuthService.UserStore().getToken();
        $.ajax(APIMAN_URL, {
          method: 'OPTIONS',
          success: function (data) {
            var url = createApimanUr(item.name, item.namespace);
            console.log("Target URL: ", url);
          },
          error: function (jqxhr, text, status) {

          },
          beforeSend: function(req) {
            req.setRequestHeader('Authorization', 'Bearer ' + token);
          }
        });
      };
      return {
        namespace: namespace,
        name: name,
        gotoApiView: gotoApiView
      }
    }

    extensionRegistry.add('service-links', _.spread(function(service) {
      var data = configureData(service);
      return {
        type: 'dom',
        node: template,
        data: data
      };
    }));

  }]);
})();
