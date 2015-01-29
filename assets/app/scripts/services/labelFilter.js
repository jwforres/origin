'use strict';

angular.module('openshiftConsole')
.factory('LabelFilter', [function() {
  function LabelFilter() {
    this._existingLabels = {};
    this._activeFilters = {};
    this._onActiveFiltersChangedCallbacks = $.Callbacks();
  }

  LabelFilter.prototype.addLabelsFromResources = function(items) {
    // check if we are extracting from a single item or a hash of items
    if (items.id || (items.metadata && items.metadata.name)) {
      this._extractLabelsFromItem(items);
    }
    else {
      var self = this;
      $each(items, function(key, item) {
        self._extractLabelsFromItem(item);
      });
    }
  };

  LabelFilter.prototype._extractLabelsFromItem = function(item) {
    // TODO temporary until we handle everything with item.metadata.labels
    var labels = item.labels;
    if (item.metadata) {
      labels = item.metadata.labels;
    }

    var self = this;
    $each(labels, function(key, value) {
      if (!self._existingLabels[key]) {
        self._existingLabels[key] = [];
      }
      self._existingLabels[key].push({value: value});
    });
  };

  LabelFilter.prototype.onActiveFiltersChanged = function(callback) {
    this._onActiveFiltersChangedCallbacks.add(callback);
  };

  LabelFilter.prototype.isResourceIncludedInActiveFilters = function(resource) {
    if (!resource) {
      return false;
    }
    var labels = resource.labels || {};
    if (resource.metadata) {
      labels = resource.metadata.labels || {};
    }
    for (var id in this._activeFilters) {
      var filter = this._activeFilters[id];
      switch(filter.operator) {
        case "EXISTS":
          if (!labels[filter.key]) {
            return false;
          }
          break;
        case "IN":
          var keep = false;
          if (labels[filter.key]) {
            for (var i = 0; i < filter.values.length; i++) {
              if (labels[filter.key] == filter.values[i]) {
                keep = true;
              }
            }
          }
          if (!keep) {
            return false;
          }
          break;
        case "NOT_IN":
          var keep = true;
          if (labels[filter.key]) {
            for (var i = 0; i < filter.values.length; i++) {
              if (labels[filter.key] == filter.values[i]) {
                keep = false;
              }
            }
          }
          if (!keep) {
            return false;
          }
      }
    }
    return true;
  };

  LabelFilter.prototype.setupFilterWidget = function() {
    var self = this;

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
        selectizeValues.load(function(callback) {
          var options = [];
          var key = $('.label-filter-key')[0].selectize.getValue();
          if (!key) {
            return options;
          }
          var optionsMap = self._existingLabels;
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
        var keys = Object.keys(self._existingLabels);
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
        var optionsMap = self._existingLabels;
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

      $('.label-filter-key')[0].selectize.clear();
      $('.selectize-control.label-filter-operator').hide();
      $('.label-filter-operator')[0].selectize.clear();
      $('.selectize-control.label-filter-values').hide();
      $('.label-filter-values')[0].selectize.clear();
      $('.label-filter-add').addClass("disabled").prop('disabled', true);              

      // show the filtering active indicator and add the individual filter to the list of active filters
      $('.label-filter-active').show();
      self._addActiveFilter({key: key, operator: operator, values: values});
    });

    $('.label-filter-active').click(function() {
      $('.label-filter-active').hide();
      $('.label-filter-active-filters').empty();
      self._clearActiveFilters();
    }); 

    // If we are transitioning scenes we may still have filters active but be re-creating the DOM for the widget
    if (!$.isEmptyObject(this._activeFilters)) {
      $('.label-filter-active').show();
      $each(this._activeFilters, function(id, filter) {
        self._renderActiveFilter(filter);
      })
    }   
  };

  LabelFilter.prototype._getLabelForFilter = function(filterDetails) {
    var filterLabel = filterDetails.key;
    if (filterDetails.operator != "EXISTS") {
      if (filterDetails.operator == "NOT_IN") {
        filterLabel += " not";
      }
      filterLabel += " in (";
      for (var i = 0; i < filterDetails.values.length; i++) {
        filterLabel += filterDetails.values[i];
        if (i != filterDetails.values.length - 1) {
          filterLabel += ", ";
        }
      }
      filterLabel += ")";
    }
    return filterLabel;
  };

  LabelFilter.prototype._getIdForFilter = function(filter) {
    return filter.key + "-" + filter.operator + "-" + filter.values.join("-");
  };

  LabelFilter.prototype._addActiveFilter = function(filter) {
    this._activeFilters[this._getIdForFilter(filter)] = filter;
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);  
    this._renderActiveFilter(filter);
  };

  LabelFilter.prototype._renderActiveFilter = function(filter) {
    // render the new filter indicator
    $('<a>')
      .addClass("label label-default label-filter-active-filter")
      .prop("href", "javascript:;")
      .prop("filter-label-id", this._getIdForFilter(filter))
      .click($.proxy(this, '_removeActiveFilter'))
      .append(
        $('<span>')
          .text(this._getLabelForFilter(filter))
          // TODO move to the less styles instead
          .css("padding-right", "5px")
      )
      .append(
        $('<i>')
          .addClass("fa fa-times")
      )
      .appendTo('.label-filter-active-filters');  
  };

  LabelFilter.prototype._removeActiveFilter = function(e) {
    var filterElem = $(e.target).closest('.label-filter-active-filter');
    var filter = filterElem.prop("filter-label-id");
    filterElem.remove();
    if($('.label-filter-active-filter').length == 0) {
      $('.label-filter-active').hide();
    }

    delete this._activeFilters[filter];
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);
  };

  LabelFilter.prototype._clearActiveFilters = function() {
    this._activeFilters = {};
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);
  };

  return new LabelFilter();
}]);