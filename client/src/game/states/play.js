angular.module('game.states.play', [])

  // GAME STATE: PLAYING
  /**
   * The in-game (during play) jaws state object.
   * This is the workhorse that handles all gameplay.
   */
  .factory('PlayState', function () {

    return function PlayState() { // in-game state

      /**
       * inits for the PlayState class: called once
       */
      this.setup = function () {

        if (debugmode)
          log("PlayState.setup");

        // special message that tells C# whether or not to send back button events to js or handle natively
        console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');

        // wp8: try to reclaim some RAM that was used during inits/asset downloading
        if (typeof(window.CollectGarbage) == "function") {
          window.CollectGarbage();
          if (debugmode)
            log('PlayState.setup just did a CollectGarbage()');
        }

        profile_start("playstate setup");

        // reset all game states
        game_over = false;
        wave_current = 0;
        wave_none_left = false;
        wave_entitynum = 0;
        wave_next_spawntime = 0;
        pendingLevelComplete = false;
        buildPendingPixelX = FAR_AWAY;
        buildPendingPixelY = FAR_AWAY;
        buildPendingTileX = FAR_AWAY;
        buildPendingTileY = FAR_AWAY;
        player_Gold = player_gold_startwith;
        displayedGold = 0; // immediately count up
        buildMenuOFF();
        wave_next_spawntime = currentFrameTimestamp - 1; // NOW! don't wait for intro cinematic to finish: insta

        // no leftover particles
        clearParticles();

        // init the sprite sheet tiles
        if (use_level_sprite_sheet) {
          if (!sprite_sheet) {
            if (debugmode)
              log("Chopping up tiles spritesheet...");
            sprite_sheet = new jaws.SpriteSheet({
                image : "tiles.png",
                frame_size : [TILESIZE, TILESIZE],
                orientation : 'right'
              });
          }
        }

        // a generic sprite list for everything we need to draw first (like the terrainSprite)
        if (!game_objects)
          game_objects = new jaws.SpriteList();
        // game_objects persists beyond levels since it contains the buildMenuSprite

        // reset in between play sessions - a list of clickable buttons
        guiButtonSprites = new jaws.SpriteList(); /// see guiClickMaybe()

        // create new sprite lists (overwriting any left over from a previous game)
        entities = new jaws.SpriteList();
        teams[TEAM_BAD] = new jaws.SpriteList();
        teams[TEAM_GOOD] = new jaws.SpriteList();
        healthbarsprites = new jaws.SpriteList();

        initLevel(level[current_level_number]);
        if (gui_enabled)
          updateGUIsprites(WaveGUI, time_remaining); // change from 000 imediately

        // scrolling background images
        if (use_parallax_background) {
          if (!parallax) {
            parallax = new jaws.Parallax({
                repeat_x : true,
                repeat_y : true
              }); // skelevator was repeat_y: false
            parallax.addLayer({
              image : "parallax.png",
              damping : 4
            });
            //parallax.addLayer({ image: "parallaxlayer2.png", damping: 4 });
          }
        }

        // reset the player score if this is the first level
        // also, start the intro cinematic NPC dialogue
        if (current_level_number == starting_level_number) {
          player_Gold = player_gold_startwith;
          player_nextGoldAt = 0; // timestamp when we get another gold - fixme: wait a full second?
          introSceneNumber = 0;
          introCinematic(); // start the NPC dialogue
        }
        updateGUIsprites(GoldGUI, player_Gold); // immediate update to proper value in case it changed prev level

        player_maxHealth = 15;
        player_Health = 15;
        updateGUIsprites(HealthGUI, player_Health);

        // the respawn particle system!
        // if (particles_enabled) startParticleSystem(startx, starty, 5);

        // set up the chase camera view
        viewport = new jaws.Viewport({
            max_x : viewport_max_x,
            max_y : viewport_max_y
          });
        jaws.activeviewport = viewport; // resize events need this in global scope

        // start the timer! (fires once a second until game_over == true)
        stopwatchstart = 0;
        // clear any previous timers just in case
        if (game_timer)
          window.clearInterval(game_timer);
        game_timer = window.setInterval(stopwatchfunc, 1000);
        //game_timer = window.setTimeout(stopwatchfunc, 1000);

        profile_end("playstate setup");

        if (debugmode)
          log('PlayState.setup() completed.');

      }; // end setup function

      /**
       * game simulation loop step - called every frame during play
       */
      this.update = function () {

        profile_start('UPDATE SIMULATION');

        if (lastframetime == 0)
          lastframetime = new Date().valueOf();
        currentFrameTimestamp = new Date().valueOf();
        currentframems = (currentFrameTimestamp - lastframetime);

        // allow pausing
        if (allow_pausing) {
          if (jaws.pressed("p")) {
            // debounce: don't switch every single frame
            // while you hold down the key
            if (!this.pausetoggledelayuntil || (currentFrameTimestamp > this.pausetoggledelayuntil)) {
              this.pausetoggledelayuntil = currentFrameTimestamp + 1000;
              pauseGame(!game_paused);
            } else {
              if (debugmode)
                log('ignoring pause button until ' + this.pausetoggledelayuntil);
            }

          }
        }
        if (game_paused)
          return;

        // update the a-star Pathfinding class instance
        if (AI)
          AI.update();

        // update the tweener, moving entities
        if (tween)
          tween.update();

        // slowly earn gold IF we aren't in the intro cinematic
        if (player_nextGoldAt <= currentFrameTimestamp) {
          // removed, since the enemies start spawing right away now
          //if (introSceneNumber > 98) {
          player_nextGoldAt = currentFrameTimestamp + ms_per_gold;
          player_Gold++;
          updateGoldGUI();
          //}
          //else {
          //    if (debugmode>2) log('No gold earning during intro');
          //}
        }

        // Update the game simulation:
        // We calculate how much time in ms has elapsed since last frame
        // and run the physics/etc step functions 1 or more times.
        // Why? Since each step is a fixed step for 60fps
        // this ensures the game runs at the same speed
        // no matter what the performance and avoids
        // delta-based (time*speed) simulation steps that can
        // "poke through" walls if the fps is low
        unsimulatedms += currentframems;
        simstepsrequired = Math.floor(unsimulatedms / oneupdatetime);
        if (simstepsrequired > 10) {
          // max out just in case 1 fps; no "hanging"
          simstepsrequired = 10;
          unsimulatedms = 0;
        }
        lastframetime = currentFrameTimestamp;

        for (var sims = 0; sims < simstepsrequired; sims++) {

          unsimulatedms -= oneupdatetime;

          framecount++;

          // do we need to spawn another entity?
          if ((wave_next_spawntime !== 0) && wave_next_spawntime <= currentFrameTimestamp) {
            wave_next_spawntime = currentFrameTimestamp + wave_spawn_interval_ms;
            waveSpawnNextEntity();
          }

          // animate the entities
          if (entities) {
            entities.forEach(entityAI);
          }

          // useful for other types of games (such as ones with auto-scrolling):
          // ensure player never goes beyond the edge of the screen
          // this interferes with "falling off the edge" however
          // viewport.forceInside(sprite, 10);

          //viewport.centerAround(game_objects.at(0)); // fixme
          // should we follow the first known entity?

          // this works but we want tween to control it with moveCamera(px,py);
          /*
          if (entities) {
          var cameraFollows = entities.at(0);
          //viewport.centerAround(cameraFollows); // fixme broken if level is smaller than viewport
          viewport.x = Math.floor(cameraFollows.x - viewport.width / 2);
          viewport.y = Math.floor(cameraFollows.y - viewport.height / 2);
          }
           */

          if (use_parallax_background) {
            // update parallax background scroll
            parallax.camera_x = viewport.x;
            // skelevator: line below was commented out:
            parallax.camera_y = viewport.y; // buggy? it works now... but the bg image only tiles horiz...
          }

          if (gui_enabled)
            updateGoldGUI(); // every frame!? optimize? OK?

          // update the buildMenu
          if (buildMenuOverlay1) {
            var fundingPercent;

            fundingPercent = player_Gold / buildCost[0];
            if (fundingPercent >= 1) {
              fundingPercent = 1;
              buttonHighlight[0].setImage(buttonHighlightImageON);
            } else {
              buttonHighlight[0].setImage(buttonHighlightImageOFF);
            }
            buildMenuOverlay1.setHeight(buildMenuOverlayHeight - (buildMenuOverlayHeight * fundingPercent));

            fundingPercent = player_Gold / buildCost[1];
            if (fundingPercent >= 1) {
              fundingPercent = 1;
              buttonHighlight[1].setImage(buttonHighlightImageON);
            } else {
              buttonHighlight[1].setImage(buttonHighlightImageOFF);
            }
            buildMenuOverlay2.setHeight(buildMenuOverlayHeight - (buildMenuOverlayHeight * fundingPercent));

            fundingPercent = player_Gold / buildCost[2];
            if (fundingPercent >= 1) {
              fundingPercent = 1;
              buttonHighlight[2].setImage(buttonHighlightImageON);
            } else {
              buttonHighlight[2].setImage(buttonHighlightImageOFF);
            }
            buildMenuOverlay3.setHeight(buildMenuOverlayHeight - (buildMenuOverlayHeight * fundingPercent));
          }

          if (particles_enabled)
            updateParticles();

        } // end sims loop for FPS independence

        // one or more collisions above may have set this to true
        if (pendingLevelComplete)
          levelComplete();

        profile_end('UPDATE SIMULATION');

      }; // end update function

      /**
       * the primary game render loop - called every frame during play
       */
      this.draw = function () {

        // when pausing, we need to render one frame first
        if (game_paused && !need_to_draw_paused_sprite) {
          return;
        }

        profile_start('DRAW EVERYTHING');

        if (use_parallax_background && parallax) {
          parallax.draw();
        } else {
          // we don't need to bother clearing the screen because the parallax fills entire bg
          jaws.context.fillStyle = background_colour;
          jaws.context.fillRect(0, 0, jaws.width, jaws.height);
        }

        viewport.apply(function () {

          game_objects.draw(); // all the non tilemap moving objects - just the terrain background and build menu for now!

          if (entities)
            entities.drawIf(viewport.isPartlyInside);
          if (healthbarsprites)
            healthbarsprites.drawIf(viewport.isPartlyInside);

          profile_start('particles');
          particles.drawIf(viewport.isPartlyInside);
          profile_end('particles');

        });

        if (gui_enabled)
          renderGUI();

        if (need_to_draw_paused_sprite) {
          need_to_draw_paused_sprite = false;
          PausedGUI.draw();
        }

        // intro cinematic
        if (introCinematicBG)
          introCinematicBG.draw();
        if (currentIntroCinematicSprite)
          currentIntroCinematicSprite.draw();

        profile_end('DRAW EVERYTHING');

      }; // PlayState.draw

    };
  });