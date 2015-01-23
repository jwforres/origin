angular.module('openshiftConsole')
  .directive('sidebar', function(HawtioNav) {
    return {
      restrict: 'E', 
      templateUrl: 'views/_sidebar.html',
      link: function($scope, element, attrs) {
        var selectedTab = HawtioNav.selected();
        if (selectedTab) {
          $scope.sidebarHeading = selectedTab.title();
        }
      }
    };
  })
  .directive('sidebarNavItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: "views/_sidebar-main-nav-item.html"
    };
  })
  .directive('projectNav', function($timeout, $location) {
    return {
      restrict: 'E',
      scope: {
        projects: '=',
        selected: '='
      },       
      templateUrl: 'views/_project-nav.html',
      link: function ($scope, element, attrs) {
        // The double timeout is a hack to guarantee DOM is finished rendering
        $timeout(function () {
          $timeout(function () {
            $('.selectpicker').selectpicker().change(function() {
              var newProject = $( this ).val();
              var currentURL = $location.url();
              var currProjRegex = /\/project\/[^\/]+/;
              var currProjPrefix = currProjRegex.exec(currentURL);
              var newURL = currentURL.replace(currProjPrefix, "/project/" + encodeURIComponent(newProject));
              $scope.$apply(function() {
                $location.url(newURL);
              });
            });

            // we would be getting this from the actual data
            var options = [
              {key: "test"},
              {key: "test2"},
              {key: "test3"}
            ];

            var optionsMap = {
              test: [{value: "foo"}, {value: "bar"}, {value: "baz"}],
              test2: [{value: "foo2"}, {value: "bar2"}, {value: "baz2"}],
              test3: [{value: "foo3"}, {value: "bar3"}, {value: "baz3"}]
            };

            $('.label-filter-key').selectize({
              valueField: "key",
              labelField: "key",
              searchField: ["key"],
              openOnFocus: true,  // why is this not working...
              options : options,
              create: true,
              persist: false,
              maxOptions: 2,
              onItemAdd: function(value, $item) {
                $('.selectize-control.label-filter-operator').css("display", "inline-block");
                $('.label-filter-operator')[0].selectize.focus();
              },
              onItemRemove: function(value) {
                $('.selectize-control.label-filter-operator').hide();
                $('.label-filter-operator')[0].selectize.clear();
                $('.selectize-control.label-filter-values').hide();
                $('.label-filter-values')[0].selectize.clear();
                $('.label-filter-add').addClass("disabled").prop('disabled', true);
              }
            });

            $('.label-filter-operator').selectize({
              valueField: "type",
              labelField: "label",
              searchField: ["label"],
              openOnFocus: true,  // why is this not working...
              options: [
                {type: "EXISTS", label: "(exists)"},
                {type: "IN", label: "in (...)"},
                {type: "NOT_IN", label: "not in (...)"}
              ],
              onItemAdd: function(value, $item) {
                // if we selected "EXISTS" enable the add button and stop here
                if (value == "EXISTS") {
                  $('.label-filter-add').removeClass("disabled").prop('disabled', false).focus();
                  return;
                }

                // otherwise
                $('.selectize-control.label-filter-values').css("display", "inline-block");
                var selectizeValues = $('.label-filter-values')[0].selectize;
                selectizeValues.clearOptions();

                var key = $('.label-filter-key')[0].selectize.getValue();
                // for each value for key
                for (var i = 0; i < optionsMap[key].length; i++) {                  
                  selectizeValues.addOption(optionsMap[key][i]);
                }
                selectizeValues.focus();        
              },
              onItemRemove: function(value) {
                $('.selectize-control.label-filter-values').hide();
                $('.label-filter-values')[0].selectize.clear();
                $('.label-filter-add').addClass("disabled").prop('disabled', true);
              }
            });

            $('.selectize-control.label-filter-operator').hide();

            $('.label-filter-values').selectize({
              valueField: "value",
              labelField: "value",
              searchField: ["value"],
              openOnFocus: true,  // why is this not working... because of webcomponent.js (chrome works),
                                  // true is the default so dont need to actually set this
              create: true,
              persist: true, // i want this to be false but there appears to be a bug in selectize where setting
                             // this to false has a side effect of causing items that were not created by the user
                             // to also disappear from the list after being removed
              onItemAdd: function(value, $item) {
                $('.label-filter-add').removeClass("disabled").prop('disabled', false);
              },
              onItemRemove: function(value) {
                // disable button if we have removed all the values                
              }
            });

            $('.selectize-control.label-filter-values').hide();

            $('.label-filter-add').click(function() {
              // grab the values before clearing out the fields
              console.log();
              var key = $('.label-filter-key')[0].selectize.getValue();
              var operator = $('.label-filter-operator')[0].selectize.getValue();
              var values = $('.label-filter-values')[0].selectize.getValue();
              var newFilterLabel = key;
              if (operator == "EXISTS") {
                key += " (exists)"
              }
              else {
                if (operator == "NOT_IN") {
                  newFilterLabel += " not";
                }
                newFilterLabel += " in (";
                for (var i = 0; i < values.length; i++) {
                  newFilterLabel += values[i];
                  if (i != values.length - 1) {
                    newFilterLabel += ", "
                  }
                }
                newFilterLabel += ")";
              }
              console.log(newFilterLabel);

              $('.label-filter-key')[0].selectize.clear();
              $('.selectize-control.label-filter-operator').hide();
              $('.label-filter-operator')[0].selectize.clear();
              $('.selectize-control.label-filter-values').hide();
              $('.label-filter-values')[0].selectize.clear();
              $('.label-filter-add').addClass("disabled").prop('disabled', true);              

              // show the filtering active indicator and add the individual filter to the list of active filters
              $('.label-filter-active').show();
              $('<a>')
                .addClass("label label-default label-filter-active-filter")
                .prop("href", "javascript:;")
                .click(function(e) {
                  $(e.target).closest('.label-filter-active-filter').remove();

                  // TODO actually remove the filter from the saved list of active filters (not just visually)
                  if($('.label-filter-active-filter').length == 0) {
                    $('.label-filter-active').hide();
                  }
                })
                .append(
                  $('<span>')
                    .text(newFilterLabel)
                )
                .append(
                  $('<i>')
                    .addClass("fa fa-times")
                )
                .appendTo('.label-filter-active-filters');

                // TODO actually add the filter to a saved list of active filters (not just visually)
            });

            $('.label-filter-active').click(function() {
              $('.label-filter-active').hide();
              $('.label-filter-active-filters').empty();

              // TODO actually clear out all saved filters (not just visually)
            });

          }, 0);
        }, 0);
      }      
    };
  })
  .directive('projectPage', function() {
    return {
      restrict: 'E', 
      transclude: true,
      templateUrl: 'views/_project-page.html'
    };
  });
