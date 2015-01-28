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
  .directive('projectNav', function($timeout, $location, LabelFilter) {
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

            $('.label-filter-key').selectize({
              valueField: "key",
              labelField: "key",
              searchField: ["key"],
              create: true,
              persist: true, // i want this to be false but there appears to be a bug in selectize where setting
                             // this to false has a side effect of causing items that were not created by the user
                             // to also disappear from the list after being removed
              preload: true,
              onItemAdd: function(value, $item) {
                var selectizeValues = $('.label-filter-values')[0].selectize;
                selectizeValues.clearOptions();

                //var key = $('.label-filter-key')[0].selectize.getValue();
                // for each value for key
                //for (var i = 0; i < optionsMap[key].length; i++) {                  
                //  selectizeValues.addOption(optionsMap[key][i]);
                //}
                selectizeValues.load(function(callback) {
                  var options = [];
                  var key = $('.label-filter-key')[0].selectize.getValue();
                  if (!key) {
                    return options;
                  }
                  var optionsMap = LabelFilter.getLabels();
                  //for each value for key
                  for (var i = 0; i < optionsMap[key].length; i++) {                  
                    options.push(optionsMap[key][i]);
                  }                
                  callback(options);
                });          

                $('.selectize-control.label-filter-operator').css("display", "inline-block");
                var operator = $('.label-filter-operator')[0].selectize.getValue();
                if (!operator) {
                  $('.label-filter-operator')[0].selectize.focus();
                }                
                else {
                  selectizeValues.focus();
                }
              },
              onItemRemove: function(value) {
                $('.selectize-control.label-filter-operator').hide();
                $('.label-filter-operator')[0].selectize.clear();
                $('.selectize-control.label-filter-values').hide();
                $('.label-filter-values')[0].selectize.clear();
                $('.label-filter-add').addClass("disabled").prop('disabled', true);
              },
              load: function(query, callback) {
                var options = [
                ];
                var keys = LabelFilter.getLabelKeys();
                for (var i = 0; i < keys.length; i++) {
                  options.push({
                    key: keys[i]
                  });
                }                
                callback(options);
              }
            });

            $('.label-filter-operator').selectize({
              valueField: "type",
              labelField: "label",
              searchField: ["label"],
              options: [
                {type: "EXISTS", label: "exists"},
                {type: "IN", label: "in ..."},
                {type: "NOT_IN", label: "not in ..."}
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
              plugins: ['remove_button'],
              create: true,
              persist: true, // i want this to be false but there appears to be a bug in selectize where setting
                             // this to false has a side effect of causing items that were not created by the user
                             // to also disappear from the list after being removed
              preload: true,
              onItemAdd: function(value, $item) {
                $('.label-filter-add').removeClass("disabled").prop('disabled', false);
              },
              onItemRemove: function(value) {
                // disable button if we have removed all the values                
              },
              load: function(query, callback) {
                var options = [];
                var key = $('.label-filter-key')[0].selectize.getValue();
                if (!key) {
                  return options;
                }
                var optionsMap = LabelFilter.getLabels();
                //for each value for key
                for (var i = 0; i < optionsMap[key].length; i++) {                  
                  options.push(optionsMap[key][i]);
                }                
                callback(options);
              }
            });

            $('.selectize-control.label-filter-values').hide();

            $('.label-filter-add').click(function() {
              // grab the values before clearing out the fields
              var key = $('.label-filter-key')[0].selectize.getValue();
              var operator = $('.label-filter-operator')[0].selectize.getValue();
              var values = $('.label-filter-values')[0].selectize.getValue();
              var newFilterLabel = key;
              if (operator != "EXISTS") {
                if (operator == "NOT_IN") {
                  newFilterLabel += " not";
                }
                newFilterLabel += " in (";
                for (var i = 0; i < values.length; i++) {
                  newFilterLabel += values[i];
                  if (i != values.length - 1) {
                    newFilterLabel += ", ";
                  }
                }
                newFilterLabel += ")";
              }
              var encodedFilterLabel = encodeURIComponent(newFilterLabel);

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

                  LabelFilter.removeActiveFilter(encodedFilterLabel);
                  if($('.label-filter-active-filter').length == 0) {
                    $('.label-filter-active').hide();
                  }
                })
                .append(
                  $('<span>')
                    .text(newFilterLabel)
                    .css("padding-right", "5px")
                )
                .append(
                  $('<i>')
                    .addClass("fa fa-times")
                )
                .appendTo('.label-filter-active-filters');
                LabelFilter.addActiveFilter(encodedFilterLabel, {key: key, operator: operator, values: values});
            });

            $('.label-filter-active').click(function() {
              $('.label-filter-active').hide();
              $('.label-filter-active-filters').empty();
              LabelFilter.clearActiveFilters();
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
