angular.module('game.engine.timer', [])

.value('timerConfig', {
  
})

.factory('timer', function () {
  return {
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

      if (!game_paused) {
        time_remaining += time_direction;
        //if (gui_enabled) updateGUIsprites(WaveGUI, time_remaining);

        // spawn entities via the waves of enemies
        // this is now done using timestamps in the playstate update loop
        // wave_next_spawntime = currentFrameTimestamp + wave_spawn_interval_ms;
        // waveSpawnNextEntity();

      }

      if ((time_remaining < 1) && gameover_when_time_runs_out) {
        if (debugmode)
          log('RAN OUT OF TIME!');
        //sfxdie();
        transition_mode = TRANSITION_GAME_OVER;
        jaws.switchGameState(LevelTransitionScreenState);
        // will eventually call gameOver(false);
      }

      //window.setTimeout(stopwatchfunc, 1000);
    }
  };
});