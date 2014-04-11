angular.module('game.entities', [])

  .value('entityType', {
    FODDER: 0,          // never attacks
    SOLDIER: 1,         // touch attack
    ARCHER: 2,          // distance attack
    MAGE: 3             // region attack
  });