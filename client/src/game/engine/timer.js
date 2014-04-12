angular.module('game.engine.timer', [
  'game.engine.transition'
])

.factory('timer', function (transition, gameplay, settings) {
  
  var timer = {
    // timer
    game_paused: 3, // 0=playing 1=paused 3=mainmenu
    allow_pausing: false, // this is a non-keyboard game
    game_timer: undefined, // set by SetInterval for the timer.tick
    game_over: true, // are we currently playing?
    frame_count: 0,
    last_frame_time: 0,
    current_frame_timestamp: 0,
    one_update_time: 1000 / 60, // how many milliseconds per simulation update
    unsimulated_dms: 0, // used for framerate independence
    current_frame_ms: 0, // so that movement is the same at any FPS
    sim_steps_required: 0, // how many simulation steps were required this frame?
    fps_prev_timestamp: 0,
    fps_prev_framecount: 0,
    fps_framecount: 0,
    stopwatch_start: 0,
    
    /**
     * tick function for a game timer - called once per second
     * this is often called the game's heartbeat clock
     */
     tick: function tick() { 

      if (!timer.timer.game_paused) {
        gameplay.time_remaining += gameplay.time_direction;
      }

      if ((gameplay.time_remaining < 1) && settings.gameover_when_time_runs_out) {
        $log.debug('RAN OUT OF TIME!');
        transition.mode = transition.gameOver;
        jaws.switchGameState(levelTransistionState);
      }
    }
  };

  return timer;
});