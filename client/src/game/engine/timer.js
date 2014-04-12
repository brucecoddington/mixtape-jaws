angular.module('game.engine.timer', [
  'game.engine.transition'
])

.factory('timer', function (transition) {
  
  var timer = {
    // timer
    game_paused: 3, // 0=playing 1=paused 3=mainmenu
    allow_pausing: false, // this is a non-keyboard game
    game_timer: undefined, // set by SetInterval for the stopwatchfunc
    game_over: true, // are we currently playing?
    framecount: 0,
    lastframetime: 0,
    currentFrameTimestamp: 0,
    oneupdatetime: 1000 / 60, // how many milliseconds per simulation update
    unsimulatedms: 0, // used for framerate independence
    currentframems: 0, // so that movement is the same at any FPS
    simstepsrequired: 0, // how many simulation steps were required this frame?
    fps_prev_timestamp: 0,
    fps_prev_framecount: 0,
    fps_framecount: 0,
    stopwatchstart: 0,
    
    /**
     * tick function for a game timer - called once per second
     * this is often called the game's heartbeat clock
     */
     tick: function stopwatchfunc() { // fixme todo unused

      if (!timer.game_paused) {
        gameplay.time_remaining += gameplay.time_direction;
      }

      if ((gameplay.time_remaining < 1) && settings.gameover_when_time_runs_out) {
        $log.debug('RAN OUT OF TIME!');
        transition.mode = transition.gameOver;
        jaws.switchGameState(LevelTransitionScreenState);
      }
    }
  };

  return timer;
});