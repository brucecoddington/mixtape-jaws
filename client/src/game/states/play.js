angular.module('game.states.play', [
  'game.system.profiler',
  'game.engine.timer',
  'game.engine.particles',
  'game.engine.level',
  'game.engine.config',
  'game.engine.ai',
  'game.entities.enemy',
  'game.entities.player',
  'game.ui.build',
  'game.ui.hud',
  'game.ui.sprite',
  'game.ui.gui',
  'game.ui.background',
  'game.ui.viewport',
  'game.states.intro'
])
/**
 * The in-game (during play) jaws state object.
 * This is the workhorse that handles all gameplay.
 */
.factory('playState', function ($log, entityAI, hud, intro, profiler, timer, enemyWave, level, buildMenu, player, particleSystem, sprite, gui, settings, gameplay, background, viewport, pathfinder) {

  var play = {

    setup: function setup() {
      $log.debug("playState.setup");
      profiler.start("playstate setup");

      // reset all game states
      timer.game_over = false;

      enemyWave.current = 0;
      enemyWave.none_left = false;
      enemyWave.entitynum = 0;
      enemyWave.next_spawntime = 0;
      
      level.pending_level_complete = false;
      
      buildMenu.pending_pixelX = settings.farAway;
      buildMenu.pending_pixelY = settings.farAway;
      buildMenu.pending_tileX = settings.farAway;
      buildMenu.pending_tileY = settings.farAway;
      
      player.gold = player.gold_startwith;
      
      hud.get('gold').displayed_gold = 0; // immediately count up
      
      buildMenu.off();
      
      enemyWave.next_spawntime = timer.current_frame_timestamp - 1; // NOW! don't wait for intro cinematic to finish: insta

      // no leftover particleSystem.particles
      particleSystem.clear();

      // create new sprite lists (overwriting any left over from a previous game)
      sprite.init();

      level.init(level.data[level.current_level_number]);

      if (gui.gui_enabled) {
        gui.updateGui(hud.get('wave').instance, gameplay.time_remaining); // change from 000 imediately
      }

      // scrolling background images
      if (background.use_parallax_background) {

        if (!background.parallax) {
          background.parallax = new jaws.Parallax({
            repeat_x : true,
            repeat_y : true
          }); // skelevator was repeat_y: false

          background.parallax.addLayer({
            image : "background.parallax.png",
            damping : 4
          });
        }
      }

      // reset the player score if this is the first level
      // also, start the intro cinematic NPC dialogue
      if (level.current_level_number == level.starting_level_number) {
        player.gold = player.gold_startwith;
        player.next_gold_at = 0; // timestamp when we get another gold - fixme: wait a full second?
        intro.scene_number = 0;
        intro.cinematic(); // start the NPC dialogue
      }

      gui.updateGui(hud.get('gold').instance, player.gold); // immediate update to proper value in case it changed prev level

      player.maxHealth = 15;
      player.health = 15;

      gui.updateGui(hud.get('health').instance, player.health);

      viewport.init();

      // start the timer! (fires once a second until timer.game_over == true)
      timer.stopwatch_start = 0;

      // clear any previous timers just in case
      if (timer.game_timer) {
        window.clearInterval(timer.game_timer);
      }
    
      timer.game_timer = window.setInterval(timer.tick, 1000);

      profiler.end("playstate setup");

      $log.debug('playState.setup() completed.');
    },

    update: function update() {
      profiler.start('UPDATE SIMULATION');

      if (timer.last_frame_time === 0) {
        timer.last_frame_time = new Date().valueOf();
      }
        
      timer.current_frame_timestamp = new Date().valueOf();
      timer.current_frame_ms = (timer.current_frame_timestamp - timer.last_frame_time);

      // allow pausing
      if (timer.allow_pausing) {

        if (jaws.pressed("p")) {
          // debounce: don't switch every single frame
          // while you hold down the key
          if (!play.pausetoggledelayuntil || (timer.current_frame_timestamp > play.pausetoggledelayuntil)) {
            play.pausetoggledelayuntil = timer.current_frame_timestamp + 1000;
            game.pause(!timer.game_paused);
          
          } else {
            $log.debug('ignoring pause button until ' + play.pausetoggledelayuntil);
          }
        }
      }

      if (timer.game_paused) {
        return;
      }

      // update the a-star pathfinder class instance
      pathfinder.update();

      // update the tweener, moving entities
      if (tween) {
        tween.update();
      }

      // slowly earn gold IF we aren't in the intro cinematic
      if (player.next_gold_at <= timer.current_frame_timestamp) {
        // removed, since the enemies start spawing right away now
        //if (intro.scene_number > 98) {
        player.next_gold_at = timer.current_frame_timestamp + settings.ms_per_gold;
        player.gold++;
        gui.updateGold();
      }

      // Update the game simulation:
      // We calculate how much time in ms has elapsed since last frame
      // and run the physics/etc step functions 1 or more times.
      // Why? Since each step is a fixed step for 60fps
      // this ensures the game runs at the same speed
      // no matter what the performance and avoids
      // delta-based (time*speed) simulation steps that can
      // "poke through" walls if the fps is low
      timer.unsimulated_dms += timer.current_frame_ms;
      timer.sim_steps_required = Math.floor(timer.unsimulated_dms / timer.one_update_time);

      if (timer.sim_steps_required > 10) {
        // max out just in case 1 fps; no "hanging"
        timer.sim_steps_required = 10;
        timer.unsimulated_dms = 0;
      }

      timer.last_frame_time = timer.current_frame_timestamp;

      for (var sims = 0; sims < timer.sim_steps_required; sims++) {

        timer.unsimulated_dms -= timer.one_update_time;

        timer.frame_count++;

        // do we need to spawn another entity?
        if ((enemyWave.next_spawntime !== 0) && enemyWave.next_spawntime <= timer.current_frame_timestamp) {
          enemyWave.next_spawntime = timer.current_frame_timestamp + enemyWave.spawnInterval_ms;
          enemyWave.spawn();
        }

        // animate the entities
        if (sprite.entities) {
          sprite.entities.forEach(entityAI.update);
        }

        // useful for other types of games (such as ones with auto-scrolling):
        // ensure player never goes beyond the edge of the screen
        // this interferes with "falling off the edge" however
        // viewport.forceInside(sprite, 10);

        if (background.use_parallax_background) {
          // update background.parallax background scroll
          background.parallax.camera_x = viewport.x;
          // skelevator: line below was commented out:
          background.parallax.camera_y = viewport.y; // buggy? it works now... but the bg image only tiles horiz...
        }

        if (gui.gui_enabled) {
          gui.updateGold(); // every frame!? optimize? OK?
        }

        // update the buildMenu
        if (buildMenu.overlay1) {
          var fundingPercent;

          fundingPercent = player.gold / settings.build_cost[0];
          if (fundingPercent >= 1) {
            fundingPercent = 1;
            buildMenu.button_highlight[0].setImage(buildMenu.button_highlight_image_on);
          } else {
            buildMenu.button_highlight[0].setImage(buildMenu.button_highlight_image_off);
          }
          buildMenu.overlay1.setHeight(buildMenu.overlay_height - (buildMenu.overlay_height * fundingPercent));

          fundingPercent = player.gold / settings.build_cost[1];
          if (fundingPercent >= 1) {
            fundingPercent = 1;
            buildMenu.button_highlight[1].setImage(buildMenu.button_highlight_image_on);
          } else {
            buildMenu.button_highlight[1].setImage(buildMenu.button_highlight_image_off);
          }
          buildMenu.overlay2.setHeight(buildMenu.overlay_height - (buildMenu.overlay_height * fundingPercent));

          fundingPercent = player.gold / settings.build_cost[2];
          if (fundingPercent >= 1) {
            fundingPercent = 1;
            buildMenu.button_highlight[2].setImage(buildMenu.button_highlight_image_on);
          } else {
            buildMenu.button_highlight[2].setImage(buildMenu.button_highlight_image_off);
          }
          buildMenu.overlay3.setHeight(buildMenu.overlay_height - (buildMenu.overlay_height * fundingPercent));
        }

        if (particleSystem.particles_enabled) {
          particleSystem.update();
        }
      }

      // one or more collisions above may have set this to true
      if (level.pending_level_complete) {
        level.complete();
      }

      profiler.end('UPDATE SIMULATION');
    },

    draw: function draw() {
      // when pausing, we need to render one frame first
      if (timer.game_paused && !gui.need_to_draw_paused_sprite) {
        return;
      }

      profiler.start('DRAW EVERYTHING');

      if (background.use_parallax_background && background.parallax) {
        background.parallax.draw();
      } else {
        // we don't need to bother clearing the screen because the background.parallax fills entire bg
        jaws.context.fillStyle = background.color;
        jaws.context.fillRect(0, 0, jaws.width, jaws.height);
      }

      viewport.instance.apply(function () {

        sprite.game_objects.draw(); // all the non tilemap moving objects - just the terrain background and build menu for now!

        if (sprite.entities) {
          sprite.entities.drawIf(viewport.instance.isPartlyInside);
        }

        if (sprite.healthbar_sprites) {
          sprite.healthbar_sprites.drawIf(viewport.instance.isPartlyInside);
        }

        profiler.start('particleSystem.particles');
        particleSystem.particles.drawIf(viewport.instance.isPartlyInside);
        profiler.end('particleSystem.particles');

      });

      if (gui.gui_enabled) {
        hud.render();
      }

      if (gui.need_to_draw_paused_sprite) {
        gui.need_to_draw_paused_sprite = false;
        gui.paused_sprite.draw();
      }

      // intro cinematic
      if (intro.cinematic_bg) {
        intro.cinematic_bg.draw();
      }
        
      if (intro.current_cinematic_sprite) {
        intro.current_cinematic_sprite.draw();
      }

      profiler.end('DRAW EVERYTHING');
    }
  };

  return play;
});