angular.module('game.entities', [
  'game.entities.enemy',
  'game.entities.game',
  'game.entities.particleSystem.particles',
  'game.entities.player',
  'game.entities.weapon'
])

.value('entityType', {
  FODDER: 0,          // never attacks
  SOLDIER: 1,         // touch attack
  ARCHER: 2,          // distance attack
  MAGE: 3             // region attack
})

.value('team', {
  bad: 0,
  team.good: 1
});