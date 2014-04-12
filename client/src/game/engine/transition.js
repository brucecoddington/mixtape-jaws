angular.module('game.engine.transition', [])
  
.value('transition', {
  // transitions between levels
  endtime: undefined,
  mode: undefined,
  levelComplete: 0,
  gameOver: 1,
  length_ms: 5000 // five seconds
});