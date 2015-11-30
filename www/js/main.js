"use strict";
angular.module('main', ['ionic', 'main.controllers'])
.config(function($stateProvider, $urlRouterProvider) {
    // configure the URL routing
    $urlRouterProvider.otherwise('/app/weaponhit');

    $stateProvider
    .state('app', { url: '/app', abstract: true, templateUrl: 'views/main.html', controller: 'MainCtrl' })
    .state('app.about',             { url: '/about',            views: { 'panelContent': { templateUrl: 'views/about.html',          controller: 'AboutCtrl'            } } })
    .state('app.weaponhit',         { url: '/weaponhit',        views: { 'panelContent': { templateUrl: 'views/weaponhit.html',      controller: 'WeaponHitCtrl'        } } })
    .state('app.meleehit',          { url: '/meleehit',         views: { 'panelContent': { templateUrl: 'views/meleehit.html',       controller: 'MeleeHitCtrl'         } } })
    .state('app.weaponlocation',    { url: '/weaponlocation',   views: { 'panelContent': { templateUrl: 'views/weaponlocation.html', controller: 'WeaponLocationCtrl'   } } })
    .state('app.meleelocation',     { url: '/meleelocation',    views: { 'panelContent': { templateUrl: 'views/meleelocation.html',  controller: 'MeleeLocationCtrl'    } } })
    .state('app.cluster',           { url: '/cluster',          views: { 'panelContent': { templateUrl: 'views/cluster.html',        controller: 'ClusterCtrl'          } } });
}).config(function($logProvider) {
    // enable the debug log level
    $logProvider.debugEnabled(true);
})
.run(function($ionicPlatform,$dice) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
}).factory('$dice', function ($log) {
    return {
        roll1d6 : function () {
            var d = 1 + Math.floor(Math.random() * 6);
            $log.debug("roll1d6() rolled: " + d);
            return d;
        },
        roll2d6 : function () {
            var d1 = 1 + Math.floor(Math.random() * 6);
            var d2 = 1 + Math.floor(Math.random() * 6);
            var d  = d1 + d2;
            $log.debug("roll2d6() rolled: " + d1 + " + " + d2 + " = " + d);
            return d;
        }
    };
});
