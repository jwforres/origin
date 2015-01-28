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

  LabelFilter.prototype.getLabels = function() {
    return this._existingLabels;
  };

  LabelFilter.prototype.getLabelKeys = function() {
    return Object.keys(this._existingLabels);
  };

  LabelFilter.prototype.addActiveFilter = function(filterId, filterDetails) {
    this._activeFilters[filterId] = filterDetails;
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);
  };

  LabelFilter.prototype.removeActiveFilter = function(filter) {
    delete this._activeFilters[filter];
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);
  };

  LabelFilter.prototype.clearActiveFilters = function() {
    this._activeFilters = {};
    this._onActiveFiltersChangedCallbacks.fire(this._activeFilters);
  };

  LabelFilter.prototype.getActiveFilters = function() {
    return this._activeFilters;
  };

  LabelFilter.prototype.onActiveFiltersChanged = function(callback) {
    this._onActiveFiltersChangedCallbacks.add(callback);
  };

  LabelFilter.prototype.isResourceIncludedInActiveFilters = function(resource) {
    if (!resource) {
      return false;
    }
    var labels = resource.labels;
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

  return new LabelFilter();
}]);