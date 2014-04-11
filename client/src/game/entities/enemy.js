angular.module('game.entities.enemy', [])
  
  .value('walker', {
    // our walking units
    entity_animation_framerate: 100, // ms per frame (8 frame walkcycle)
    entityanimation: [], // [1..3] the sprite sheet for our four walking units, split into frames
    includeDeadBodies: true // if false, they simply dissappear when killed
  })

  .factory('enemyWave', function () {
    // Game data for enemy waves
    
    return {
      ENTITY_MIN_RACE: 1,
      ENTITY_MAX_RACE: 4,
      wave_spawn_interval_ms: 1500, // time delay between enemies
      wave_next_spawntime: 0, // timestamp
      wave_current: 0, // which wave are we on?
      wave_entitynum: 0, // which entity are we up to?
      wave_none_left: false, // once all entities are dead AND this is true then we must have beat the level!
      wave_max: 99, // for the "XX of YY" wave gui
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
      waveSpawnNextEntity: function waveSpawnNextEntity() {

        // avoid edge case race condition: ensure the game's up and running
        if (!currentFrameTimestamp)
          return;

        if (debugmode)
          log('Level:' + current_level_number + ' Wave:' + wave_current + ' Ent:' + wave_entitynum + ' at ' + currentFrameTimestamp);

        if (!wave[current_level_number]) {
          if (debugmode)
            log('No more levels in the wave data!');
          wave_none_left = true;
          return;
        }

        if (!wave[current_level_number][wave_current]) {
          if (debugmode)
            log('No more waves in this level!');
          wave_none_left = true;
          checkLevelComplete();
          return;
        }

        if (wave_entitynum == 0) // brand new wave just started
        {
          wave_max = wave[current_level_number].length;
          updateGUIsprites(WaveGUI, ((wave_current + 1) * 10) + wave_max); // for "3 of 5" we send 35
          if (debugmode)
            log('NEW WAVE STARTING: ' + (wave_current + 1) + ' of ' + wave_max);
        }

        // none remaining in this wave?
        if (wave[current_level_number][wave_current].length - 1 < wave_entitynum) {
          if (debugmode)
            log('No more entities in this wave!');
          wave_entitynum = 0;
          wave_current++;
          //waveSpawnNextEntity(); // recurse with new numbers - nah, just wait till next heartbeat
          return;
        }

        wave_none_left = false;

        var nextone = wave[current_level_number][wave_current][wave_entitynum];
        // create the new entity from this wave (or just wait if it was a zero)
        if (nextone > 0) {
          // this sound overlaps with too much at the start: removed wp8
          // sfx.play('spawn');
          var birthX = AI.spawnX * TILESIZE + TILESIZEDIV2; // + wobbleAI();
          var birthY = AI.spawnY * TILESIZE + TILESIZEDIV2; // + wobbleAI();
          startParticleSystem(birthX, birthY, particleSPAWN);
          spawnEntity(birthX, birthY, nextone, TEAM_BAD);
        }

        wave_entitynum++;

      }
    };
  });