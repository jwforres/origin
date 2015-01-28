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

  return new LabelFilter();
}]);