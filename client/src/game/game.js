// Game namespace
angular.module('game.container', [
	'game.controllers',
  'game.data',
  'game.engine',
  'game.entities',
  'game.gui',
  'game.states'
])

.factory('game', function (level0, level1, level2, level3) {

  var debugTouchInfo = settings.farAway; // what spritemap tile # did we last touch?

  var game = {
    /**
     * Called when the user selects a level from the main menu
     * Switches game state to playState
     */
    start: function start() {
      if (debugmode) {
        log('START GAME NOW!');
      }
      gui.gui.showing_level_select_screen = false;
      timer.game_paused = false; // keyboard doesn't reset this
      //sfxstart();
      level.current_level_number = starting_level_number; // start from the first level (or whichever the user selected)
      particles.clear();
      jaws.switchGameState(playState); // Start game!
    },

    /**
     * Click/touch event that fires when the user selects a level from the menu
     */
    levelSelectClick: function levelSelectClick(px, py) {
      $log.debug('levelSelectClick' + px + ',' + py);
      sfx.play('mapclick');

      // the map is split into quadrants - which island did we click?
      if ((px < jaws.width / 2) && (py < jaws.height / 2)) {
        $log.debug('Selected LEVEL 0');
        starting_level_number = 0;
      
      } else if ((px >= jaws.width / 2) && (py < jaws.height / 2)) {
        $log.debug('Selected LEVEL 1');
        starting_level_number = 1;
      
      } else if ((px < jaws.width / 2) && (py >= jaws.height / 2)) {
        $log.debug('Selected LEVEL 2');
        starting_level_number = 2;
      
      } else if ((px >= jaws.width / 2) && (py >= jaws.height / 2)) {
        $log.debug('Selected LEVEL 3');
        starting_level_number = 3;
      }

      game.start();
    },

    /**
     * During play, this will pause/unpause the game.
     * Called by either a resize event (snapped view, etc.)
     * or the user (touch pause button, press [P]
     */
    pause: function pause(pauseplease) {

      if (pauseplease) { // pause ON
        $log.debug('[PAUSING]');

        // we might be in the main menu (timer.game_paused==3)
        if (timer.game_paused != 3) {
          timer.game_paused = true;
        }

        // because main menu is already considered "paused"
        gui.need_to_draw_paused_sprite = true;

      } else { // paused OFF
        $log.debug('[UN-PAUSING]');

        gui.need_to_draw_paused_sprite = false;

        if (timer.game_paused != 3) {
          timer.game_paused = false;
        }
      }

      $log.debug('pause toggle: ' + timer.game_paused);

      // when we start up again, we don't want
      // the time elapsed to be simulated suddenly
      timer.last_frame_time = new Date().valueOf();
      timer.unsimulated_dms = 0;
      timer.current_frame_ms = 0;

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
      if (timer.game_paused == 3) {
        timer.game_paused = false;
        $log.debug('Unpausing the titlescreen = start the game!');
      }
    },

    /**
     * Ends the game and returns to the title screen
     */
    gameOver: function gameOver(beatTheGame) {
      $log.debug('gameOver!');

      if (beatTheGame) {
        $log.debug('VICTORY!');
      }

      // clear any previous timers just in case
      if (timer.game_timer) {
        window.clearInterval(timer.game_timer);
      }

      timer.game_over = true;

      // FIXME TODO - this works except old data still in ram!
      // for beta we just reload the page instead. FIXME TODO
      jaws.switchGameState(titleState);
      //document.location.reload(false); // false means use the cache
    },

    // fixme todo this could be a entity.function
    takeDamage: function takeDamage(victim, fromwho) {
      $log.debug('Damage! Victim has ' + victim.health + ' hp minus ' + fromwho.weapon.damage);

      // queue up a particle effect for the near future
      victim.pendingParticles = 1; // smoke for a while? no, just once
      victim.pendingParticleType = fromwho.weapon.particleHit;
      // delay the explosion so projectile has time to get there
      victim.nextPartyTime = timer.current_frame_timestamp + particle.projectileExplosionDelay;

      // also queue up damage for after the projectile flies through the air
      victim.pendingDamage = fromwho.weapon.damage;
      victim.pendingAttacker = fromwho;
    },

    /**
     * Main Game Inits begin here - called by jaws.onload.
     * Enumerates level data and window events and requests art/sounds to be downloaded.
     * Many other inits occur only once art/sounds have been loaded:
     * see titleState.setup() and playState.setup()
     */
    init: function init() {
      $log.debug('game.init ' + window.innerWidth + 'x' + window.innerHeight);

      // Create a canvas
      var canvas = document.createElement("canvas");
      
      // liquid layout: stretch to fill
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // the id the game engine looks for
      canvas.id = 'canvas';
      
      // add the canvas element to the html document
      document.body.appendChild(canvas);
      
      // we want it referenced right now, to be ready for touch event listeners before loading is complete
      jaws.canvas = canvas;

      // a simple scroll can eliminate the browser address bar on many mobile devices
      scrollTo(0, 0); // FIXME: we might need 0,1 due to android not listening to 0,0

      // these are put here only to force them on TOP of the info listing
      profiler.start('UPDATE SIMULATION');
      profiler.end('UPDATE SIMULATION');
      profiler.start('DRAW EVERYTHING');
      profiler.end('DRAW EVERYTHING');

      // make sure the game is liquid layout resolution-independent (RESPONSIVE)
      window.addEventListener("resize", onResize, false);

      // also load all the sounds if required
      if (!mute) {
        soundInit();
      }
        
      // enumerate any level data included in other <script> tags
      var levelnext = 0;
      while (window['level' + levelnext]) {
        level.data.push(window['level' + levelnext]);
        levelnext++;
      }
      $log.debug('Max level number: ' + (levelnext - 1));

      // start downloading all the art using a preloader progress screen
      jaws.assets.root = preload.all_game_assets_go_here;
      jaws.assets.add(preload.all_game_assets);

      $log.debug('game.init completed.');

      // once the art has been loaded we will create an instance of this class
      // and begin by running its setup function, then the update/draw loop
      jaws.start(titleState); // the GUI sprites are created here as needed
    },
    
    handleBackButton: function () {
      if (!timer.game_over) {
        game.gameOver(false); // return to previous menu
      } else { // already in the titlescreen game state: check credits or level select screen?
        if (gui.showing_credits) {
          gui.showing_credits = false;
          gui.gui.showing_level_select_screen = false;
          gui.menu_item_selected = 0;
          timer.game_paused = 3; // reset
        } else if (gui.gui.showing_level_select_screen) {
          gui.showing_credits = false;
          gui.gui.showing_level_select_screen = false;
          gui.menu_item_selected = 0;
          timer.game_paused = 3; // reset
        }
      }
    },

    /**
     * this function is used to detect when the screen size has changed
     * due to rotation of a tablet or going into "snapped" view
     * it resizes the game canvas and pauses the game
     */
    onResize: function onResize(e) {
      $log.debug('onResize!');
      $log.debug('window size is now ' + $window.innerWidth + 'x' + $window.innerHeight);

      // for example, on a 1366x768 tablet, swiped to the side it is 320x768
      jaws.canvas.width = $window.innerWidth;
      jaws.canvas.height = $window.innerHeight;
      jaws.width = jaws.canvas.width;
      jaws.height = jaws.canvas.height;

      if (viewport.instance) {
        viewport.instance.width = jaws.canvas.width;
        viewport.instance.height = jaws.canvas.height;
      }

      // move the gui elements around
      gui.liquidLayoutGUI();

      // wait for the user to be ready to play
      // fixme todo - in BROWSER this can make unpausing a problem! FIXME TODO
      // only for snapped view and other small displays
      game.pause($window.innerWidth() < 321);
    }
  };

  return game;
	
});