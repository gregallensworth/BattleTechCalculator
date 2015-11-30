"use strict";
angular.module('main.controllers', [])
.controller('MainCtrl', function($scope,$dice) {
    // this is the root controller enclosing all the rest defined below
    // this is a good place to copy services for use in views
    $scope.$dice = $dice;
})
.controller('AboutCtrl', function($scope) {
    // nothing here; this panel has no actions ... yet
})
.controller('WeaponHitCtrl', function($scope,$dice,$ionicLoading) {
})
.controller('MeleeHitCtrl', function($scope,$dice,$ionicLoading) {
})
.controller('WeaponLocationCtrl', function($scope,$dice,$ionicLoading) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        outcome  : 0,
        critroll : 0,
        crithits : 0,
    };

    // dice roller function
    // show a modal and wait a second, then roll dice
    // $ionicLoading.show() does support an automatic timeout, but visually it works better to highlight the outcome AFTER the delay as if dice had been really rolled
    $scope.rollAndHighlight = function () {
        $ionicLoading.show({
            templateUrl: 'views/roll2d6.html'
        });
        $scope.viewdata.outcome = 0;
        setTimeout(function () {
            $scope.viewdata.outcome = $scope.$dice.roll2d6();
            $ionicLoading.hide();

            // whoa there! on a 2 we do an additional roll to detect a critical hit
            // and that crithit means a second roll for how many crits they earned
            // tip: there's no critical hit calculator, since every mech is different
            if (2 != $scope.viewdata.outcome) {
                $scope.viewdata.critroll = 0;
                $scope.viewdata.crithits = 0;
            } else {
                $scope.viewdata.critroll = $scope.$dice.roll2d6();
                if      ($scope.viewdata.critroll <= 7)  $scope.viewdata.crithits = 0;
                else if ($scope.viewdata.critroll <= 9)  $scope.viewdata.crithits = 1;
                else if ($scope.viewdata.critroll < 12)  $scope.viewdata.crithits = 2;
                else                                     $scope.viewdata.crithits = 3;
            }
        }, 1000);
    };
})
.controller('MeleeLocationCtrl', function($scope,$dice,$ionicLoading) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        meleetype: "punch",
        outcome  : 0,
    };

    // dice roller function
    // show a modal and wait a second, then roll dice
    // $ionicLoading.show() does support an automatic timeout, but visually it works better to highlight the outcome AFTER the delay as if dice had been really rolled
    $scope.rollAndHighlight = function () {
        $ionicLoading.show({
            templateUrl: 'views/roll1d6.html'
        });
        $scope.viewdata.outcome = 0;
        setTimeout(function () {
            $scope.viewdata.outcome = $scope.$dice.roll1d6();
            $ionicLoading.hide();
        }, 1000);
    };
})
.controller('ClusterCtrl', function($scope,$dice,$ionicLoading) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        clustersize : "10",
        outcome     : 0,
    };

    // dice roller function
    // show a modal and wait a second, then roll dice
    // $ionicLoading.show() does support an automatic timeout, but visually it works better to highlight the outcome AFTER the delay as if dice had been really rolled
    $scope.rollAndHighlight = function () {
        $ionicLoading.show({
            templateUrl: 'views/roll2d6.html'
        });
        $scope.viewdata.outcome = 0;
        setTimeout(function () {
            $scope.viewdata.outcome = $scope.$dice.roll2d6();
            $ionicLoading.hide();
        }, 1000);
    }
});
