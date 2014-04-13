angular.module('game.states.transitions', [
  'game.engine.transition',
  'game.engine.timer',
  'game.engine.particles',
  'game.engine.level',
  'game.engine.sfx',
  'game.ui.background',
  'game.ui.gui'
])
  
/**
 * A jaws state object for the display in between levels (and game over) screen.
 * Used to display messages like "game over" or "congratulations"
 */
.factory('levelTransistionState', function ($injector, $log, transition, timer, particleSystem, background, gui, level, sfx) {

  var levelTransition = {
    
    setup: function () {

      $log.debug('Game State: transition after level ' + level.current_level_number);

      // clear the stopwatch timer if any
      if (timer.game_timer) {
        window.clearInterval(timer.game_timer);
      }

      transition.endtime = new Date().valueOf() + transition.length_ms; // five seconds

      timer.game_paused = true; // no clock updates

      if (transition.mode === transition.gameOver) {
        sfx.play('Defeat');
      }

      if (transition.mode === transition.complete) {
        level.current_level_number++; // upcoming level
        sfx.play('Victory');
      }

    }, 

    update: function update() {

      if (particleSystem.particles_enabled) {
        particleSystem.update();
      }

      // fireworks!
      if (Math.random() > 0.92) {
        particleSystem.start(jaws.width / 4 + Math.random() * jaws.width / 2, jaws.height / 2 - 200 + (Math.random() * 400));
      }

      if (background.use_parallax_background) {
        // update parallax background scroll
        background.title_background.camera_x += 4;
      }

      if (transition.endtime < (new Date().valueOf())) {
        $log.debug('transition time is up');

        timer.game_paused = false; // keyboard doesn't reset this

        if (transition.mode === transition.gameOver) {
          $log.debug('transitioning from game over to titlescreen');
          $injector.get('game').gameOver(false);

        } else {
          
          if (level[level.current_level_number]) {
            $log.debug('about to play level ' + level.current_level_number);
            jaws.switchGameState(playState); // begin the next level
          
          } else {
            $log.debug('no more level data: the user BEAT the game!');
            $injector.get('game').gameOver(true);
          }
        }
      }

    }, 

    draw: function draw() {

      if (background.use_parallax_background) {
        background.title_background.draw();
      }

      gui.msgbox_sprite.draw();
      
      if (transition.mode == transition.gameOver) {
        gui.gameover_sprite.draw();
        gui.youlose_sprite.draw();
      
      } else {

        if (level[level.current_level_number]) { // more to come?
          gui.level_complete_sprite.draw();

        } else { // game over: final level completed!
          gui.gameover_sprite.draw();
          gui.game_won_sprite.draw();
        }
      }

      if (particleSystem.particles_enabled) {
        particleSystem.particles.draw();
      }
    }
  };

  return levelTransition;
});