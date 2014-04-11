// Game namespace
angular.module('game.container', [
	'game.controllers',
  'game.data.levels'
])
	.factory('game', function (level0, level1, level2, level3) {

    ///////////////////////////////////////////////
    // private variables used for debug etc.
    ///////////////////////////////////////////////
    var info_tag; // debug only: the FPS and performance stats DOM element
    var debugTouchInfo = FAR_AWAY; // what spritemap tile # did we last touch?
    var world_complexity = 0; // current # tiles that were found in the level data - used for debugging only
    var profile_starts = []; // for debug only: performance PROFILER
    var profile_length = []; // time how long things take to find performance bottlenecks
    var profile_maxlen = []; // this is only done if we are in debugmode

    return {
      ///////////////////////////////////////////////
      // debug only - turn this off when you go live!
      ///////////////////////////////////////////////
      debugmode: 0, // 1 for debug info and profiler, >1 for DETAILED INFO
  
      // the pre-rendered map terrain (level1.png etc)
      terrainSprite: null,

      // levels
      level: [], // an array of json level data objects
      starting_level_number: 0, // should be zero except when testing
      current_level_number: starting_level_number, // which one are we playing?
      pendingLevelComplete: false, // do we need to change levels next frame?
      TILESIZE: 64, // skelevator 32, // pixel dimensions of the level spritesheet tiles
      TILESIZEDIV2: (TILESIZE / 2) | 0, // |0 just forces integer type

      /**
       * Called when the user selects a level from the main menu
       * Switches game state to PlayState
       */
      start: function startGameNow() {
        if (debugmode) {
          log('START GAME NOW!');
        }
        showing_levelselectscreen = false;
        game_paused = false; // keyboard doesn't reset this
        //sfxstart();
        current_level_number = starting_level_number; // start from the first level (or whichever the user selected)
        clearParticles();
        jaws.switchGameState(PlayState); // Start game!
      },

      /**
       * Click/touch event that fires when the user selects a level from the menu
       */
      levelSelectClick: function levelSelectClick(px, py) {
        if (debugmode)
          log('levelSelectClick' + px + ',' + py);

        sfx.play('mapclick'); // wp8

        // the map is split into quadrants - which island did we click?
        // fixmto todo: use guisprites for each new level we add, scattered on the map
        if ((px < jaws.width / 2) && (py < jaws.height / 2)) {
          if (debugmode)
            log('Selected LEVEL 0');
          starting_level_number = 0;
        } else if ((px >= jaws.width / 2) && (py < jaws.height / 2)) {
          if (debugmode)
            log('Selected LEVEL 1');
          starting_level_number = 1;
        } else if ((px < jaws.width / 2) && (py >= jaws.height / 2)) {
          if (debugmode)
            log('Selected LEVEL 2');
          starting_level_number = 2;
        } else if ((px >= jaws.width / 2) && (py >= jaws.height / 2)) {
          if (debugmode)
            log('Selected LEVEL 3');
          starting_level_number = 3;
        }

        // fixme todo: the level init can take > 1 second!
        // we need feedback immediately after a click
        // IDEA: render again with a new image

        ///////////////
        startGameNow();
        ///////////////
      },

      /**
       * During play, this will pause/unpause the game.
       * Called by either a resize event (snapped view, etc.)
       * or the user (touch pause button, press [P]
       */
      pause: function pauseGame(pauseplease) {

        if (pauseplease) { // pause ON

          if (debugmode)
            log('[PAUSING]');

          // we might be in the main menu (game_paused==3)
          if (game_paused != 3)
            game_paused = true;

          // because main menu is already considered "paused"
          need_to_draw_paused_sprite = true;

        } else // paused OFF
        {
          if (debugmode)
            log('[UN-PAUSING]');

          need_to_draw_paused_sprite = false;

          if (game_paused != 3)
            game_paused = false;

        }

        if (debugmode)
          log('pause toggle: ' + game_paused);

        // when we start up again, we don't want
        // the time elapsed to be simulated suddenly
        lastframetime = new Date().valueOf();
        unsimulatedms = 0;
        currentframems = 0;

        if (pauseplease) {
            if (window.Howler) window.Howler.mute(); // music/sound
        } else {
            if (window.Howler) window.Howler.unmute(); // music/sound
        }
      },

      /**
       * only used during the title screen menu
       */
      // FIXME: this is called on ANY click anytime - spammy
      unPause: function unPause(e) {
        if (game_paused == 3) {
          game_paused = false;
          if (debugmode)
            log('Unpausing the titlescreen = start the game!');
        }
        // unmute the music?
        //Howler.unmute();
      },

      /**
       * Ends the game and returns to the title screen
       */
      gameOver: function gameOver(beatTheGame) {
        if (debugmode)
          log('gameOver!');

        if (beatTheGame) {
          if (debugmode)
            log('VICTORY!');
        }

        // clear any previous timers just in case
        if (game_timer)
          window.clearInterval(game_timer);

        game_over = true;

        // FIXME TODO - this works except old data still in ram!
        // for beta we just reload the page instead. FIXME TODO
        jaws.switchGameState(TitleScreenState);
        //document.location.reload(false); // false means use the cache
      },

        // fixme todo this could be a entity.function
      takeDamage: function takeDamage(victim, fromwho) {
        if (debugmode)
          log('Damage! Victim has ' + victim.health + ' hp minus ' + fromwho.weapon.damage);

        // queue up a particle effect for the near future
        victim.pendingParticles = 1; // smoke for a while? no, just once
        victim.pendingParticleType = fromwho.weapon.particleHit;
        // delay the explosion so projectile has time to get there
        victim.nextPartyTime = currentFrameTimestamp + PROJECTILE_EXPLOSION_DELAY;

        // also queue up damage for after the projectile flies through the air
        victim.pendingDamage = fromwho.weapon.damage;
        victim.pendingAttacker = fromwho;

        /*
        victim.health -= fromwho.weapon.damage;
        if (victim.healthbarsprite) {
        if (victim.health > 75) victim.healthbarsprite.setImage(healthbarImage[0]);
        else if (victim.health > 50) victim.healthbarsprite.setImage(healthbarImage[1]);
        else if (victim.health > 25) victim.healthbarsprite.setImage(healthbarImage[2]);
        else victim.healthbarsprite.setImage(healthbarImage[3]);
        }

        if (victim.health <= 0) {
        if (debugmode) log('Entity destroyed!');
        // if we just died: play particle immediately! (else it gets skipped since entityAI is never run)
        //startParticleSystem(victim.x, victim.y + ENTITY_PARTICLE_OFFSETY, fromwho.weapon.particleHit);
        victim.active = false;
        victim.dead = true;
        victim.speed = 0;
        if (!includeDeadBodies) {
        removeEntity(victim);
        }
        else {
        // a little random death location
        victim.rotateTo(90 + (Math.random() * 10 - 5)); // lie down - simple!
        victim.x += Math.random() * 8 - 4;
        victim.y += Math.random() * 8 - 4;
        victim.alpha = 0.5; // slightly transparent
        // stop checking collisions
        teams[victim.team].remove(victim);
        // stop drawing its healthbar
        if (victim.healthbarsprite) healthbarsprites.remove(victim.healthbarsprite);
        // check if we completed the level (eg all badguys destroyed?) fixme todo: maybe just current ones: waves
        checkLevelComplete();
        }
        }
         */
      },

      /**
       * Main Game Inits begin here - called by jaws.onload.
       * Enumerates level data and window events and requests art/sounds to be downloaded.
       * Many other inits occur only once art/sounds have been loaded:
       * see TitleScreenState.setup() and PlayState.setup()
       */
      init: function initTowerGameStarterKit() {

        if (debugmode)
          log('initTowerGameStarterKit ' + window.innerWidth + 'x' + window.innerHeight);

        // Create a canvas
        var GameCanvas = document.createElement("canvas");
        // liquid layout: stretch to fill
        GameCanvas.width = window.innerWidth;
        GameCanvas.height = window.innerHeight;
        // the id the game engine looks for
        GameCanvas.id = 'canvas';
        // add the canvas element to the html document
        document.body.appendChild(GameCanvas);
        // we want it referenced right now, to be ready for touch event listeners before loading is complete
        jaws.canvas = GameCanvas;

        // a simple scroll can eliminate the browser address bar on many mobile devices
        scrollTo(0, 0); // FIXME: we might need 0,1 due to android not listening to 0,0

        // these are put here only to force them on TOP of the info listing
        profile_start('UPDATE SIMULATION');
        profile_end('UPDATE SIMULATION');
        profile_start('DRAW EVERYTHING');
        profile_end('DRAW EVERYTHING');

        // make sure the game is liquid layout resolution-independent (RESPONSIVE)
        window.addEventListener("resize", onResize, false);

        // listen for touch events if we're running on a Win8 tablet
        initMSTouchEvents();

        // also load all the sounds if required
        if (!mute)
          soundInit();

        // enumerate any level data included in other <script> tags
        var levelnext = 0;
        while (window['level' + levelnext]) {
          level.push(window['level' + levelnext]);
          levelnext++;
        }
        if (debugmode)
          log('Max level number: ' + (levelnext - 1));

        // optionally ensure all gfx data is current by re-downloading everything (no cache)
        // breaks wp8 $ctk
        // if (debugmode) jaws.assets.bust_cache = true;

        // start downloading all the art using a preloader progress screen
        jaws.assets.root = all_game_assets_go_here;
        jaws.assets.add(all_game_assets);

        AI = new Pathfinding(); // the ai class we will use during the game

        if (debugmode)
          log('initTowerGameStarterKit completed.');

        // once the art has been loaded we will create an instance of this class
        // and begin by running its setup function, then the update/draw loop
        jaws.start(TitleScreenState); // the GUI sprites are created here as needed
        //jaws.start(PlayState); // we can't skip the titlescreen due to gui inits
      },
      
      handleBackButton: function () {
        if (!game_over) {
          console.log('BACK BUTTON: Returning to the main menu from an active game.');
          console.log('[STOP-SENDING-BACK-BUTTON-EVENTS]');
          gameOver(false); // return to previous menu
        } else // already in the titlescreen game state: check credits or level select screen?
        {
          if (showing_credits) {
            console.log('BACK BUTTON: leaving credits - returning to the main menu.');
            console.log('[STOP-SENDING-BACK-BUTTON-EVENTS]');
            showing_credits = false;
            showing_levelselectscreen = false;
            menu_item_selected = 0;
            game_paused = 3; // reset
          } else if (showing_levelselectscreen) {
            console.log('BACK BUTTON: leaving level select screen - returning to the main menu.');
            console.log('[STOP-SENDING-BACK-BUTTON-EVENTS]');
            showing_credits = false;
            showing_levelselectscreen = false;
            menu_item_selected = 0;
            game_paused = 3; // reset
          } else {
            console.log('BACK BUTTON: at the main menu: WE SHOULD NEVER GET HERE: QUIT APP PLEASE!');
            console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');
          }
        }
      },

      /**
      * Deal with Windows Phone 8 Back Button so we pass certification
      * declared globally so that the function is visible from all scopes
      */
      onWP8BackButton: function onWP8BackButton(args) {
        console.log('onWP8BackButton pressed!');
        GAME.handleBackButton();
      }
    };
		
	});