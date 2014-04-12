angular.module('game.states.transitions', [])
  
  // GAME STATE: LEVEL TRANSITIONS
  /**
   * A jaws state object for the display in between levels (and game over) screen.
   * Used to display messages like "game over" or "congratulations"
   */
  .factory('LevelTransitionScreenState', function () {
  
    return function LevelTransitionScreenState() {

      this.setup = function () {

        $log.debug('Game State: transition after level ' + current_level_number);

        // special message that tells C# whether or not to send back button events to js or handle natively
        console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');

        // wp8: try to reclaim some RAM that was used during inits/asset downloading
        if (typeof(window.CollectGarbage) == "function") {
          window.CollectGarbage();
          if (debugmode)
            log('LevelTransitionScreenState.setup just did a CollectGarbage()');
        }

        // clear the stopwatch timer if any
        if (game_timer)
          window.clearInterval(game_timer);

        transition.endtime = new Date().valueOf() + transition.length_ms; // five seconds

        game_paused = true; // no clock updates

        if (transition.mode == transition.gameOver) {
          //sfxdefeat();
          sfx.play('Defeat');
        }

        if (transition.mode == transition.levelComplete) {
          current_level_number++; // upcoming level
          //sfxvictory()
          sfx.play('Victory');

        }

      }; // transition screen setup function

      // transition screen
      this.update = function () {

        // wobble just for fun
        // msgboxSprite.scaleTo(0.75 + (Math.sin(new Date().valueOf() * 0.001) / (Math.PI * 2)));

        if (particleSystem.particles_enabled)
          updateParticles();

        // fireworks!
        if (Math.random() > 0.92) {
          particleSystem.start(jaws.width / 4 + Math.random() * jaws.width / 2, jaws.height / 2 - 200 + (Math.random() * 400));
        }

        if (use_parallax_background) {
          // update parallax background scroll
          titlebackground.camera_x += 4;
        }

        if (transition.endtime < (new Date().valueOf())) {

          if (debugmode)
            log('transition time is up');

          game_paused = false; // keyboard doesn't reset this

          if (transition.mode == transition.gameOver) {
            if (debugmode)
              log('transitioning from game over to titlescreen');
            gameOver(false);
          } else {
            if (level[current_level_number]) {
              if (debugmode)
                log('about to play level ' + current_level_number);
              //sfxstart();
              jaws.switchGameState(PlayState); // begin the next level
            } else {
              if (debugmode)
                log('no more level data: the user BEAT the game!');
              gameOver(true);
            }
          }
        }

      }; // transition screen update function

      this.draw = function () {

        if (use_parallax_background)
          titlebackground.draw();
        msgboxSprite.draw();
        if (transition.mode == transition.gameOver) {
          gameoverSprite.draw();
          youloseSprite.draw();
        } else {
          if (level[current_level_number]) // more to come?
          {
            //if (debugmode) log('Next world (level ' + current_level_number + ') exists...');
            levelcompleteSprite.draw();
          } else // game over: final level completed!
          {
            //if (debugmode) log('Next world (level ' + current_level_number + ') does not exist. GAME COMPLETED!');
            gameoverSprite.draw();
            beatTheGameSprite.draw();
          }
        }
        if (particleSystem.particles_enabled)
          particleSystem.particles.draw();

      }; // transition screen draw function

    };
  });