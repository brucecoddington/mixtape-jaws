angular.module('game.entities.config', [])
  
.value('entityType', {
  fodder: 0,          // never attacks
  soldier: 1,         // touch attack
  archer: 2,          // distance attack
  mage: 3             // region attack
})

.value('team', {
  bad: 0,
  good: 1
});