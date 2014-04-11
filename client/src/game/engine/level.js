angular.module('game.engine.level', [])

  .factory('level', function () {

    return {

     /**
      * inits a new level using json data: sets level specific variables 
      */
      init: function initLevel(leveldata) {
        profile_start('initLevel');
        if (debugmode)
          log('initLevel...');
        if (!leveldata) {
          if (debugmode)
            log('ERROR: Missing level data!');
          return;
        }
        if (!leveldata.properties) {
          if (debugmode)
            log('ERROR: Missing level.properties!');
          return;
        }

        // clear any previous levels from memory
        world_complexity = 0; // tile count

        // calculate pathfinding costs
        AI.newGrid(leveldata.layers[1].data, leveldata.width, leveldata.height);

        // remove any leftover terrain from a previous level
        if (terrainSprite)
          game_objects.remove(terrainSprite);
        // the pre-rendered map terrain eg level0.png level1.png level2.png etc
        terrainSprite = new jaws.Sprite({
            image : jaws.assets.get("level" + (current_level_number) + ".png"),
            x : 0,
            y : 0
          });
        // put the new terrain at the very first index in the game_objects spritelist array
        game_objects.unshift(terrainSprite); // why unshift and not push? so the terrain is always drawn before the buildMenu

        // unused
        time_remaining = 0;
        time_direction = 1; // count up
        gameover_when_time_runs_out = false;

        if (leveldata.properties.start_tile) {
          var startarray = String(leveldata.properties.start_tile).split(",");
          startx = parseInt(startarray[0] * leveldata.tilewidth, 10);
          starty = parseInt(startarray[1] * leveldata.tileheight, 10);
          if (debugmode)
            log('Respawn start point is: ' + startx + ',' + starty);
        }

        viewport_max_x = leveldata.width * leveldata.tilewidth;
        viewport_max_y = (leveldata.height + 2) * leveldata.tileheight; // extend past the level data: fell_too_far + 1;

        if (debugmode)
          log('initLevel complete.');

        if (debugmode)
          log('Total tiles in the world: ' + world_complexity);

        profile_end('initLevel');
      },

        /**
       * Triggered when the level has been successfully cleared.
       * Switches to the transition state before loading the next level.
       */
      complete: function levelComplete() {
        if (debugmode)
          log('Level ' + current_level_number + ' complete!');
        updateGUIsprites(GoldGUI, player_Gold); // immediate update to proper value
        //transition_mode = TRANSITION_LEVEL_COMPLETE; // fixme todo we probably don't want to reset things here. TODO: check that it is always set
        pendingLevelComplete = false;
        jaws.switchGameState(LevelTransitionScreenState);
      },

      // this is called when enemies reach their destination and damage the castle
      checkComplete: function checkLevelComplete() {
        if (player_Health < 1) {
          if (debugmode)
            log('The player has no more health! LEVEL COMPLETE GAME OVER!'); // fires 2x or more?
          pendingLevelComplete = true;
          //sfxdie();
          transition_mode = TRANSITION_GAME_OVER;
          //jaws.switchGameState(LevelTransitionScreenState); // the pendingLevelComplete above will make this happen soon
          return;
        }

        if (!teams[TEAM_BAD].length) {
          if (debugmode)
            log('The badguy team is empty!');
          if (wave_none_left) {
            if (debugmode)
              log('And there are no pending waves! LEVEL COMPLETE SUCCESS!');
            //levelComplete(); // might get called more than once if we run it here
            transition_mode = TRANSITION_LEVEL_COMPLETE;
            pendingLevelComplete = true; // handle edge case: we hit >1 in the same frame
          }
        }
      }
    };
  });