angular.module('game.engine.transition', [])
  
.value('transition', {
  // transitions between levels
  endtime: undefined,
  mode: undefined,
  level.complete: 0,
  gameOver: 1,
  length_ms: 5000 // five seconds
});