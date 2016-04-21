'use strict';
angular.module('openshiftConsole')
  .filter('upperFirst', function() {
    // Uppercase the first letter of a string (without making any other changes).
    // Different than `capitalize` because it doesn't lowercase other letters.
    return function(str) {
      if (!str) {
        return str;
      }

      return str.charAt(0).toUpperCase() + str.slice(1);
    };
  })
  .filter('camelToSentenceCase', function(upperFirstFilter) {
    // Converts a camel case string to sentence case.
    return function(str) {
      if (!str) {
        return str;
      }

      var lower = _.startCase(str).toLowerCase();
      return upperFirstFilter(lower);
    };
  })
  .filter('startCase', function () {
    return function(str) {
      if (!str) {
        return str;
      }

      // https://lodash.com/docs#startCase
      return _.startCase(str);
    };
  })
  .filter('capitalize', function() {
    return function(input) {
      return _.capitalize(input);
    };
  })
  .filter('isMultiline', function() {
    return function(str) {
      if (!str) {
        return false;
      }
      return str.indexOf('\n') !== -1;
    };
  });
