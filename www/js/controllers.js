"use strict";
angular.module('main.controllers', [])
.controller('MainCtrl', function($scope,$dice,$ionicPopup) {
    // this is the root controller enclosing all the rest defined below
    // this is a good place to copy services for use in views
    $scope.$dice = $dice;

    // now some functions we want inherited into any subcontroller
    // e.g. ability to open a modal with an error message
    $scope.showErrorMessage = function (message) {
        $ionicPopup.alert({
            title: "Error",
            template: message + "<br/><br/>" + "Please report this so we can fix it.",
            okText: 'Close',
            okType: 'button-dark',
        });
    };
})
.controller('AboutCtrl', function($scope) {
    // nothing here; this panel has no actions ... yet
})
.controller('WeaponHitCtrl', function($scope,$dice,$ionicLoading,$ionicPopup) {
})
.controller('MeleeHitCtrl', function($scope,$dice,$ionicLoading,$ionicPopup) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        attacktype: "punch",
        attackerpiloting: "5",
        defenderpiloting: "5",
        attackermove: {
            onfoot: "run",
            jumped: false,
            prone : false,
        },
        defendermove: {
            distance: "0",
            jump    : false,
            prone   : false,
            immobile: false,
        },
        defenderterrain: "open",
        mechdamage: {
            shoulder: false,
            armu    : false,
            arml    : false,
            hand    : false,
            hip     : false,
            legu    : false,
            legl    : false,
            foot    : false,
        },
        quirk1: { label:'Weather Quirk', value:'0' },
        quirk2: { label:'Pilot Quirk', value:'0' },
        quirk3: { label:'Mech Quirk', value:'0' },
        quirk4: { label:'Weapon Quirk', value:'0' },
        quirk5: { label:'Game Quirk', value:'0' },
    };

    $scope.viewdata.tohitnumber = ' ';
    $scope.viewdata.dice = { rolled:'', hitmiss:'' };

    // the recalculation function whenever someone changes a variable
    $scope.recalculateToHit = function () {
        // visual cleanup
        // un-roll the dice, so to speak: hide any orior dice roll and hit/miss outcome
        $scope.viewdata.dice.rolled = '';

        // begin calculating the to-hit number
        // start with your piloting skill, or the diff between piloting skills; depends on the attack type
        switch ($scope.viewdata.attacktype) {
            case "punch":
                $scope.viewdata.tohitnumber = parseInt($scope.viewdata.attackerpiloting);
                break;
            case "kick":
                $scope.viewdata.tohitnumber = parseInt($scope.viewdata.attackerpiloting) - 2;
                break;
            case "club":
            case "push":
                $scope.viewdata.tohitnumber = parseInt($scope.viewdata.attackerpiloting) - 1;
                break;
            case "charge":
            case "dfa":
                // difference between attacker Piloting and defender Piloting
                // your 5 to their 3 (better than yours) means a +2 modifier
                $scope.viewdata.tohitnumber = parseInt($scope.viewdata.attackerpiloting) - parseInt($scope.viewdata.defenderpiloting);
                break;
            default:
                $scope.showErrorMessage('attacktype invalid');
                break;
        }

        // attacker movement
        switch ($scope.viewdata.attackermove.onfoot) {
            case 'none':
                //$scope.viewdata.tohitnumber += 0;
                break;
            case 'walk':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'run':
                $scope.viewdata.tohitnumber += 2;
                break;
            default:
                $scope.showErrorMessage('onfoot invalid');
                break;
        }
        if ($scope.viewdata.attackermove.jumped) $scope.viewdata.tohitnumber += 3;
        if ($scope.viewdata.attackermove.prone)  $scope.viewdata.tohitnumber += 2;

        // defender movement
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.defendermove.distance); // unusual, this one we store the actual number since it's breaks
        if ($scope.viewdata.defendermove.jump)      $scope.viewdata.tohitnumber += 1;
        if ($scope.viewdata.defendermove.prone)     $scope.viewdata.tohitnumber -= 2;
        if ($scope.viewdata.defendermove.immobile)  $scope.viewdata.tohitnumber -= 4;

        // defender terrain
        if ($scope.viewdata.attacktype != 'dfa') {
            switch ($scope.viewdata.defenderterrain) {
                case 'open':
                    //$scope.viewdata.tohitnumber += 0;
                    break;
                case 'wood1':
                    $scope.viewdata.tohitnumber += 1;
                    break;
                case 'wood2':
                    $scope.viewdata.tohitnumber += 2;
                    break;
                case 'water':
                    $scope.viewdata.tohitnumber += 1;
                    break;
                default:
                    $scope.showErrorMessage('defenderterrain invalid');
                    break;
            }
        }

        // the modifier for mech damage is specific to the attack type, e.g. leg damage is irrelevant to punch but relevant to kick
        if ($scope.viewdata.mechdamage.shoulder && $scope.viewdata.attacktype == 'push') $scope.viewdata.tohitnumber += 2;
        if ($scope.viewdata.mechdamage.armu && ( $scope.viewdata.attacktype == 'punch' || $scope.viewdata.attacktype == 'club') ) $scope.viewdata.tohitnumber += 2;
        if ($scope.viewdata.mechdamage.arml && ( $scope.viewdata.attacktype == 'punch' || $scope.viewdata.attacktype == 'club') ) $scope.viewdata.tohitnumber += 2;
        if ($scope.viewdata.mechdamage.hand && $scope.viewdata.attacktype == 'punch') $scope.viewdata.tohitnumber += 1;
        if ($scope.viewdata.mechdamage.legu && $scope.viewdata.attacktype == 'kick') $scope.viewdata.tohitnumber += 2;
        if ($scope.viewdata.mechdamage.legl && $scope.viewdata.attacktype == 'kick') $scope.viewdata.tohitnumber += 2;
        if ($scope.viewdata.mechdamage.foot && $scope.viewdata.attacktype == 'kick') $scope.viewdata.tohitnumber += 1;

        // mech quirks and game quirks, and other such custom modifiers
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk1.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk2.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk3.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk4.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk5.value);

        // that was that; thanks to data binding, we're already done
    };

    // the dice-roller function
    // for visual effect, skip the automatic 'timeout' and actually wait to roll the dice and close the spinner
    $scope.rollToHit = function () {
            $ionicLoading.show({
            templateUrl: 'views/roll2d6.html'
        });
        $scope.viewdata.dice.rolled = '';
        setTimeout(function () {
            $ionicLoading.hide();
            $scope.viewdata.dice.rolled  = $scope.$dice.roll2d6();
            $scope.viewdata.dice.hitmiss = $scope.viewdata.dice.rolled >= $scope.viewdata.tohitnumber ? 'Hit' : 'Miss';
        }, 1000);
    };

    // open an editing modal, so they can change the text for a quirk
    // parameter: the quirknumber, used to resolve which quirk# is being relabeled, e.g. 1 for "quirk1"
    $scope.openQuirkLabelEditor = function (whichquirk) {
        $ionicPopup.prompt({
            title: 'Quirk Name',
            //template: 'Enter the label for this gameplay modifier (quirk).',
            defaultText: $scope.viewdata[whichquirk].label,
            okText: 'Save',
            cancelType: 'button-stable',
            okType: 'button-dark',
        }).then(function(quirklabel) {
            if (! quirklabel ) return false; // they canceled, or entered nothing; skip out and leave the label unchanged
            $scope.viewdata[whichquirk].label = quirklabel;
        });
    };

    // okay, let's start some code to load our state
    // by triggering a recalculation right now
    $scope.recalculateToHit();
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
