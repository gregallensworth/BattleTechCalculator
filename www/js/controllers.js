"use strict";
angular.module('main.controllers', ['ionic.utils'])
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
.controller('WeaponHitCtrl', function($scope,$dice,$ionicLoading,$ionicPopup,$localStorage) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        // the various selectors and widgets per the rulebook
        attackergunnery: "5",
        range: "medium",
        intervening: "none",
        targetterrain: "none",
        partialcover: "none",
        attackermove: "run",
        attackerprone: false,
        defendermove: "0",
        defenderprone: "no",
        defenderjumped: false,
        defenderimmobile: false,
        heatmodifier: "0",
        armdamaged: "0",
        sensorsdamaged: "0",

        // custom game mods, e.g. for your pilot or for the weather
        // see the MeleeQuirks loader below where we may be loading these from persistent storage
        quirk1: { label:'Pilot', value:'0' },
        quirk2: { label:'Weather', value:'0' },
        quirk3: { label:'Darkness', value:'0' },
        quirk4: { label:'Other', value:'0' },
        quirk5: { label:'Other', value:'0' },

        // current/last dice roll and outcome
        tohitnumber : ' ',
        dice: { rolled:'', hitmiss:'' },
    };

    // try to override those defaults, with values pulled from persistent storage
    // don't try to get too optimized by making tight little loops; this is likely to evolve and any such optimization is bound to be premature
    // see the storePersistent() and openQuirkLabelEditor() functions for how these get stored in the first place
    var q = $localStorage.get('WeaponVars-attackergunnery'); if (q) $scope.viewdata['attackergunnery'] = q;
    var q = $localStorage.getObject('WeaponQuirks-quirk1'); if (q.label) $scope.viewdata.quirk1 = q;
    var q = $localStorage.getObject('WeaponQuirks-quirk2'); if (q.label) $scope.viewdata.quirk2 = q;
    var q = $localStorage.getObject('WeaponQuirks-quirk3'); if (q.label) $scope.viewdata.quirk3 = q;
    var q = $localStorage.getObject('WeaponQuirks-quirk4'); if (q.label) $scope.viewdata.quirk4 = q;
    var q = $localStorage.getObject('WeaponQuirks-quirk5'); if (q.label) $scope.viewdata.quirk5 = q;

    // the recalculation function whenever someone changes a variable
    $scope.recalculateToHit = function () {
        // visual cleanup
        // un-roll the dice, so to speak: hide any orior dice roll and hit/miss outcome
        $scope.viewdata.dice.rolled = '';

        // the base to-hit number is simply your own gunnery skill
        $scope.viewdata.tohitnumber = parseInt($scope.viewdata.attackergunnery);

        // range: short is no mod, medium and long, then under minimum which is allowed but not advised
        switch ($scope.viewdata.range) {
            case 'short':
                // no modifier
                break;
            case 'medium':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'long':
                $scope.viewdata.tohitnumber += 4;
                break;
            case 'min1':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'min2':
                $scope.viewdata.tohitnumber += 3;
                break;
            case 'min3':
                $scope.viewdata.tohitnumber += 4;
                break;
            default:
                $scope.showErrorMessage('range invalid');
                break;
        }

        // intervening terrain; not the same as the terrain ON WHICH your target is standing
        switch ($scope.viewdata.intervening) {
            case 'none':
                break;
            case 'light1':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'heavy1':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'light2':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'lightheavy':
                $scope.viewdata.tohitnumber += 3;
                break;
            case 'heavy2':
                $scope.viewdata.tohitnumber += 99;
                break;
            default:
                $scope.showErrorMessage('intervening invalid');
                break;
        }

        // terrain on which your target is standing; not the same as INTERVENING terrain
        switch ($scope.viewdata.targetterrain) {
            case 'none':
                break;
            case 'light':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'heavy':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'water1':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'water2':
                $scope.viewdata.tohitnumber += 99;
                break;
            default:
                $scope.showErrorMessage('targetterrain invalid');
                break;
        }

        // any partial cover status, halfway in water, behind a short hill
        switch ($scope.viewdata.partialcover) {
            case 'none':
                break;
            case 'hill1':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'hill2':
                $scope.viewdata.tohitnumber += 99;
                break;
            default:
                $scope.showErrorMessage('partialcover invalid');
                break;
        }

        // attacker movement, prone status (jumped! biffed it!)
        if ($scope.viewdata.attackerprone) $scope.viewdata.tohitnumber += 2;

        switch ($scope.viewdata.attackermove) {
            case 'none':
                break;
            case 'walk':
                $scope.viewdata.tohitnumber += 1;
                break;
            case 'run':
                $scope.viewdata.tohitnumber += 2;
                break;
            case 'jump':
                $scope.viewdata.tohitnumber += 3;
                break;
            default:
                $scope.showErrorMessage('attackermove invalid');
                break;
        }

        // defender movement, prone or immobilized, status
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.defendermove);     // basic movement is picked from the selector, based on the "brackets"
        if ($scope.viewdata.defenderjumped)     $scope.viewdata.tohitnumber += 1;
        if ($scope.viewdata.defenderimmobile)   $scope.viewdata.tohitnumber -= 4;
        switch ($scope.viewdata.defenderprone) {
            case 'no':
                break;
            case 'adjacent':
                $scope.viewdata.tohitnumber -= 2;
                break;
            case 'nonadjacent':
                $scope.viewdata.tohitnumber += 1;
                break;
            default:
                $scope.showErrorMessage('defenderprone invalid');
                break;            
        }

        // attacker heat and damage modifiers, are simple raw numbers
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.heatmodifier);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.armdamaged);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.sensorsdamaged);
        
        // mech quirks and game quirks, and other such custom modifiers
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk1.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk2.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk3.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk4.value);
        $scope.viewdata.tohitnumber += parseInt($scope.viewdata.quirk5.value);

        // cosmetics: we +99 to impossible hits, e.g. behind a hill and underwater
        // but don't allow for stupid high numbers like 500... just 99 will suffice
        if ($scope.viewdata.tohitnumber > 100) $scope.viewdata.tohitnumber = 99;
        
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
            defaultText: $scope.viewdata[whichquirk].label,
            maxLength: 20,
            okText: 'Save',
            cancelType: 'button-stable',
            okType: 'button-dark',
        }).then(function(quirklabel) {
            if (! quirklabel ) return false; // they canceled, or entered nothing; skip out and leave the label unchanged

            // update it here in memory...
            $scope.viewdata[whichquirk].label = quirklabel;

            // ... and also in local storage so it can be recalled later; the recall would of course be done at the top of the controller, when setting default values
            var key = "WeaponQuirks-"+whichquirk;
            $localStorage.setObject(key,$scope.viewdata[whichquirk]);
        });
    };

    // an ability to store an arbitrary field as persistent; see also the top of this controller where we reload these
    $scope.storePersistent = function (variable) {
        var key   = "WeaponVars-"+variable;
        var value = $scope.viewdata[variable];
        $localStorage.set(key,value);
    };

    // okay, let's start some code to load our state
    // by triggering a recalculation right now
    $scope.recalculateToHit();
})
.controller('MeleeHitCtrl', function($scope,$dice,$ionicLoading,$ionicPopup,$localStorage) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        // the various selectors and widgets per the rulebook
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

        // custom game mods, e.g. for your pilot or for the weather
        // see the MeleeQuirks loader below where we may be loading these from persistent storage
        quirk1: { label:'Pilot', value:'0' },
        quirk2: { label:'Weather', value:'0' },
        quirk3: { label:'Darkness', value:'0' },
        quirk4: { label:'Other', value:'0' },
        quirk5: { label:'Other', value:'0' },

        // current/last dice roll and outcome
        tohitnumber : ' ',
        dice: { rolled:'', hitmiss:'' },
    };

    // try to override those defaults, with values pulled from persistent storage
    // don't try to get too optimized by making tight little loops; this is likely to evolve and any such optimization is bound to be premature
    // see the storePersistent() and openQuirkLabelEditor() functions for how these get stored in the first place
    var q = $localStorage.get('MeleeVars-attackerpiloting'); if (q) $scope.viewdata['attackerpiloting'] = q;
    var q = $localStorage.getObject('MeleeQuirks-quirk1'); if (q.label) $scope.viewdata.quirk1 = q;
    var q = $localStorage.getObject('MeleeQuirks-quirk2'); if (q.label) $scope.viewdata.quirk2 = q;
    var q = $localStorage.getObject('MeleeQuirks-quirk3'); if (q.label) $scope.viewdata.quirk3 = q;
    var q = $localStorage.getObject('MeleeQuirks-quirk4'); if (q.label) $scope.viewdata.quirk4 = q;
    var q = $localStorage.getObject('MeleeQuirks-quirk5'); if (q.label) $scope.viewdata.quirk5 = q;

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
            maxLength: 20,
            okText: 'Save',
            cancelType: 'button-stable',
            okType: 'button-dark',
        }).then(function(quirklabel) {
            if (! quirklabel ) return false; // they canceled, or entered nothing; skip out and leave the label unchanged

            // update it here in memory...
            $scope.viewdata[whichquirk].label = quirklabel;

            // ... and also in local storage so it can be recalled later; the recall would of course be done at the top of the controller, when setting default values
            var key = "MeleeQuirks-"+whichquirk;
            $localStorage.setObject(key,$scope.viewdata[whichquirk]);
        });
    };

    // an ability to store an arbitrary field as persistent; see also the top of this controller where we reload these
    $scope.storePersistent = function (variable) {
        var key   = "MeleeVars-"+variable;
        var value = $scope.viewdata[variable];
        $localStorage.set(key,value);
    };

    // okay, let's start some code to load our state
    // by triggering a recalculation right now
    $scope.recalculateToHit();
})
.controller('WeaponLocationCtrl', function($scope,$dice,$ionicLoading) {
    // default values for selectors and checkboxes and widgets
    $scope.viewdata = {
        outcome  : 0,
        critmessage : '',
    };

    // dice roller function
    // show a modal and wait a second, then roll dice
    // $ionicLoading.show() does support an automatic timeout, but visually it works better to highlight the outcome AFTER the delay as if dice had been really rolled
    $scope.rollAndHighlight = function () {
        $scope.viewdata.outcome     = 0;
        $scope.viewdata.critmessage = '';

        $ionicLoading.show({
            templateUrl: 'views/roll2d6.html'
        });
        setTimeout(function () {
            $ionicLoading.hide();
            $scope.viewdata.outcome = $scope.$dice.roll2d6();

            // whoa there! on a 2 we do an additional roll to detect a critical hit
            // and that crithit means a second roll for how many crits they earned
            // tip: there's no critical hit calculator, since every mech is different
            if ($scope.viewdata.outcome == 2) {
                var critroll = $scope.$dice.roll2d6();
                if      (critroll <= 7)  $scope.viewdata.critmessage = "Critical: Rolled " + critroll + ", " + "No critical hits";
                else if (critroll <= 9)  $scope.viewdata.critmessage = "Critical: Rolled " + critroll + ", " + "1 critical hits";
                else if (critroll < 12)  $scope.viewdata.critmessage = "Critical: Rolled " + critroll + ", " + "2 critical hits";
                else                     $scope.viewdata.critmessage = "Critical: Rolled " + critroll + ", " + "3 critical hits";
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
        $scope.viewdata.outcome = 0;
 
        $ionicLoading.show({
            templateUrl: 'views/roll1d6.html'
        });
        setTimeout(function () {
            $ionicLoading.hide();
            $scope.viewdata.outcome = $scope.$dice.roll1d6();
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
