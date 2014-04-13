angular.module('game.entities.enemy', [
  'game.data.ui.tile',
  'game.engine.particles',
  'game.engine.pathfinder',
  'game.engine.level',
  'game.engine.timer',
  'game.ui.gui',
  'game.ui.hud',
  'game.ui.tile',
  'game.entities.config'
])

.factory('enemyWave', function ($injector, $log, particle, particleSystem, timer, level, gui, waveGui, pathfinder, tileData, team) {
  // Game data for enemy waves
  
  var enemyWave = {
    minRace: 1,
    maxRace: 4,
    spawnInterval_ms: 1500, // time delay between enemies
    next_spawntime: 0, // timestamp
    current: 0, // which wave are we on?
    entitynum: 0, // which entity are we up to?
    none_left: false, // once all entities are dead AND this is true then we must have beat the level!
    max: 99, // for the "XX of YY" wave gui
    wave: [
      // level 0 starts here
      [
        // each wave is a list of entities we need to spawn
        // a zero below is just an empty space (delay) between entity spawns
        [1, 0, 2, 0, 0, 0, 0],
        [2, 0, 1, 1, 1, 2, 1, 0, 0, 0, 0],
        [1, 0, 1, 1, 1, 2, 2, 2, 2]
      ],
      // level 1 starts here
      [
        [3, 0, 3, 3, 0, 0, 0, 0],
        [1, 0, 2, 2, 3, 3, 4, 4, 0, 0, 0, 0],
        [1, 0, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 3, 3, 3, 3, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
        [3, 0, 3, 1, 0, 2, 3, 1, 3, 0, 1, 3, 2, 3, 0, 4, 3, 2, 1, 0, 1, 2, 3, 3, 1, 2, 1, 2, 1, 2, 1, 2, 1]
      ],
      // level 2 starts here
      [
        [4, 0, 4, 4, 0, 0, 0, 0],
        [3, 0, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 0, 0, 0, 0],
        [1, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0],
        [4, 0, 3, 1, 1, 2, 3, 1, 4, 1, 1, 3, 2, 4, 1, 4, 3, 2, 1, 1, 1, 2, 3, 4, 1, 2, 1, 2, 1, 2, 1, 2, 1, 0, 0, 0, 0],
        [3, 0, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3]
      ],
      // level 3 starts here
      [
        [1, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 0, 0],
        [3, 0, 3, 3, 3, 1, 2, 1, 2, 3, 3, 3, 3, 0, 0, 0, 0],
        [4, 0, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [1, 0, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 1, 1, 1, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4],
        [1, 0, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 1, 1, 1, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4],
        [1, 0, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 1, 1, 1, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4]
      ]

    ],

    /**
    * returns the next new entity in the waves of enemies for each level
    */
    spawn: function spawn() {

      // avoid edge case race condition: ensure the game's up and running
      if (!timer.current_frame_timestamp) {
        return;
      }

      $log.debug('Level:' + level.current_level_number + ' Wave:' + enemyWave.current + ' Ent:' + enemyWave.entitynum + ' at ' + timer.current_frame_timestamp);

      if (!enemyWave.wave[level.current_level_number]) {
        $log.debug('No more levels in the wave data!');
        enemyWave.none_left = true;
        return;
      }

      if (!enemyWave.wave[level.current_level_number][enemyWave.current]) {
        $log.debug('No more waves in this level!');
        enemyWave.none_left = true;
        level.checkComplete();
        return;
      }

      if (enemyWave.entitynum === 0) // brand new wave just started
      {
        enemyWave.max = enemyWave.wave[level.current_level_number].length;
        gui.updateGui(waveGui.instance, ((enemyWave.current + 1) * 10) + enemyWave.max); // for "3 of 5" we send 35
        $log.debug('NEW WAVE STARTING: ' + (enemyWave.current + 1) + ' of ' + enemyWave.max);
      }

      // none remaining in this wave?
      if (enemyWave.wave[level.current_level_number][enemyWave.current].length - 1 < enemyWave.entitynum) {
        $log.debug('No more entities in this wave!');
        enemyWave.entitynum = 0;
        enemyWave.current++;
        return;
      }

      enemyWave.none_left = false;

      var nextone = enemyWave.wave[level.current_level_number][enemyWave.current][enemyWave.entitynum];
      // create the new entity from this wave (or just wait if it was a zero)
      if (nextone > 0) {
        // this sound overlaps with too much at the start: removed wp8
        // sfx.play('spawn');
        var birthX = pathfinder.spawnX * tileData.size + tileData.sizeDiv2; // + wobbleAI();
        var birthY = pathfinder.spawnY * tileData.size + tileData.sizeDiv2; // + wobbleAI();
        particleSystem.start(birthX, birthY, particle.spawn);
        $injector.get('spawner').spawn(birthX, birthY, nextone, team.bad);
      }

      enemyWave.entitynum++;
    }
  };

  return enemyWave;
});