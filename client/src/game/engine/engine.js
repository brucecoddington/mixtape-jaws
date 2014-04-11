angular.module('game.engine', [
  'game.engine.sfx',
  'game.engine.ai'
])

.value('settings', {
  // Gameplay settings
  ms_per_gold: 1000, // how long between each new gold piece earned
  // costs for building units
  buildCost: [15, 25, 32],
  // which unit has the play selected for building
  selectedBuildingStyle: 0
})

.value('gameplay', {
  // gameplay settings - ALL UNUSED FIXME TODO?
  gameover_when_time_runs_out: false, // default: play forever // unused
  time_remaining: 0, // default: take your time and count up
  time_direction: 1, // default: count up and never die based on time
  startx: 292, // changed by the level data
  starty: 420
});