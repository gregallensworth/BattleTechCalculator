"use strict";
/*
 * create a wrapper around window.localStorage which does the stringify/parse for us
 * credits: http://learn.ionicframework.com/formulas/localstorage/
 */
angular.module('ionic.utils', [])
.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);