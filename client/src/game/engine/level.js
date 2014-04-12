angular.module('game.engine.level', [
  'game.engine.profiler'
])

.factory('level', function (profiler, LevelTransitionScreenState) {

  var level = {

    world_complexity: 0, // current # tiles that were found in the level data - used for debugging only
    terrainSprite: null,

    // levels
    data: [], // an array of json level data objects
    starting_level_number: 0, // should be zero except when testing
    current_level_number: level.starting_level_number, // which one are we playing?
    pendingLevelComplete: false, // do we need to change levels next frame?

   /**
    * inits a new level using json data: sets level specific variables 
    */
    init: function initLevel (leveldata) {
      profiler.start('initLevel');
      $log.debug('initLevel...');
      
      if (!leveldata) {
        $log.debug('ERROR: Missing level data!');
        return;
      }

      if (!leveldata.properties) {
        $log.debug('ERROR: Missing level.properties!');
        return;
      }

      // clear any previous levels from memory
      level.world_complexity = 0; // tile count

      // calculate pathfinder costs
      pathfinder.newGrid(leveldata.layers[1].data, leveldata.width, leveldata.height);

      // remove any leftover terrain from a previous level
      if (level.terrainSprite) {
        sprite.game_objects.remove(terrainSprite);
      }
        
      // the pre-rendered map terrain eg level0.png level1.png level2.png etc
      level.terrainSprite = new jaws.Sprite({
        image : jaws.assets.get("level" + (current_level_number) + ".png"),
        x : 0,
        y : 0
      });

      // put the new terrain at the very first index in the sprite.game_objects spritelist array
      sprite.game_objects.unshift(level.terrainSprite); // why unshift and not push? so the terrain is always drawn before the buildMenu

      // unused
      gameplay.time_remaining = 0;
      gameplay.time_direction = 1; // count up
      settings.gameover_when_time_runs_out = false;

      if (leveldata.properties.start_tile) {
        var startarray = String(leveldata.properties.start_tile).split(",");
        gameplay.startx = parseInt(startarray[0] * leveldata.tilewidth, 10);
        gameplay.starty = parseInt(startarray[1] * leveldata.tileheight, 10);
        $log.debug('Respawn start point is: ' + gameplay.startx + ',' + gameplay.starty);
      }

      viewport.max_x = leveldata.width * leveldata.tilewidth;
      viewport.max_y = (leveldata.height + 2) * leveldata.tileheight; // extend past the level data: fell_too_far + 1;

      $log.debug('initLevel complete.');
      $log.debug('Total tiles in the world: ' + world_complexity);

      profiler.end('initLevel');
    },

    /**
     * Triggered when the level has been successfully cleared.
     * Switches to the transition state before loading the next level.
     */
    complete: function levelComplete() {
      $log.debug('Level ' + level.current_level_number + ' complete!');
      sprite.updateAll(goldGui.instance, player_Gold); // immediate update to proper value
      level.pendingLevelComplete = false;
      jaws.switchGameState(LevelTransitionScreenState);
    },

    // this is called when enemies reach their destination and damage the castle
    checkComplete: function checkComplete() {
      if (player.health < 1) {
        $log.debug('The player has no more health! LEVEL COMPLETE GAME OVER!'); // fires 2x or more?
        level.pendingLevelComplete = true;
        transition.mode = transition.gameOver;
        return;
      }

      if (!sprite.teams[team.bad].length) {
        $log.debug('The badguy team is empty!');
        
        if (enemyWave.none_left) {
          $log.debug('And there are no pending waves! LEVEL COMPLETE SUCCESS!');
          transition.mode = transition.levelComplete;
          level.pendingLevelComplete = true; // handle edge case: we hit >1 in the same frame
        }
      }
    }
  };

  return level;
});