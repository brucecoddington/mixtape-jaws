angular.module('game.engine.level', [
  'game.system.profiler',
  'game.engine.pathfinder',
  'game.ui.sprite',
  'game.ui.viewport',
  'game.ui.gui',
  'game.system.settings.entities'
])

.factory('level', function ($injector, $log, profiler, pathfinder, sprite, gameplay, viewport, settings, goldGui, player, transition, team, gui) {

  var startingLevelNumber = 0;

  var level = {

    world_complexity: 0, // current # tiles that were found in the level data - used for debugging only
    terrainSprite: null,

    // levels
    data: [], // an array of json level data objects
    starting_level_number: startingLevelNumber, // should be zero except when testing
    current_level_number: startingLevelNumber, // which one are we playing?
    pending_level_complete: false, // do we need to change levels next frame?

   /**
    * inits a new level using json data: sets level specific variables 
    */
    init: function init (leveldata) {
      profiler.start('level.init');
      $log.debug('level.init...');
      
      if (!leveldata) {
        $log.error('ERROR: Missing level data!');
        return;
      }

      if (!leveldata.properties) {
        $log.error('ERROR: Missing level.properties!');
        return;
      }

      // clear any previous levels from memory
      level.world_complexity = 0; // tile count

      // calculate pathfinder costs
      pathfinder.newGrid(leveldata.layers[1].data, leveldata.width, leveldata.height);

      // remove any leftover terrain from a previous level
      if (level.terrainSprite) {
        sprite.game_objects.remove(level.terrainSprite);
      }
        
      // the pre-rendered map terrain eg level0.png level1.png level2.png etc
      level.terrainSprite = new jaws.Sprite({
        image : jaws.assets.get("map/level" + (level.current_level_number) + ".png"),
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

      $log.debug('level.init complete.');
      $log.debug('Total tiles in the world: ' + level.world_complexity);

      profiler.end('level.init');
    },

    /**
     * Triggered when the level has been successfully cleared.
     * Switches to the transition state before loading the next level.
     */
    complete: function complete() {
      $log.debug('Level ' + level.current_level_number + ' complete!');
      gui.updateGui(hud.get('gold').instance, player.gold); // immediate update to proper value
      level.pending_level_complete = false;
      jaws.switchGameState($injector.get('levelTransistionState'));
    },

    // this is called when enemies reach their destination and damage the castle
    checkComplete: function checkComplete() {
      if (player.health < 1) {
        $log.debug('The player has no more health! LEVEL COMPLETE GAME OVER!'); // fires 2x or more?
        level.pending_level_complete = true;
        transition.mode = transition.gameOver;
        return;
      }

      if (!sprite.teams[team.bad].length) {
        $log.debug('The badguy team is empty!');
        
        if ($injector.get('enemyWave').none_left) {
          $log.debug('And there are no pending waves! LEVEL COMPLETE SUCCESS!');
          transition.mode = transition.complete;
          level.pending_level_complete = true; // handle edge case: we hit >1 in the same frame
        }
      }
    }
  };

  return level;
});