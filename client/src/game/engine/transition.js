angular.module('game.engine.transition', [])
  
.value('transition', {
  // transitions between levels
  transitionEndtime: undefined,
  transition_mode: undefined,
  TRANSITION_LEVEL_COMPLETE: 0,
  TRANSITION_GAME_OVER: 1,
  TRANSITION_LENGTH_MS: 5000 // five seconds
});