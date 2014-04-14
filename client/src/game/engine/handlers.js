angular.module('game.engine.handlers', [
  'game.system.settings.ui',
  'game.engine.handlers',
  'game.ui.viewport',
  'game.ui.sprite',
  'game.ui.tile'
])
  
.factory('handlers', function ($log, viewport, sprite, gui, timer, tile, tileData) {

  var handlers = {

    clickMaybe: function clickMaybe(px, py) {
      $log.debug('handlers.clickMaybe ' + px + ',' + py);

      var weClickedSomething = false;
      // loop through any sprites in this list
      sprite.button_sprites.filter(function (nextone) {
        return nextone.rect().collidePoint(px, py);
      })
        .forEach(function (nextone) {
          $log.debug('GUI button was clicked!');

          // trigger, if any
          if (nextone.action) {
            weClickedSomething = true;
            nextone.action(px, py);
          }
        });

      return weClickedSomething;
    },

    /**
     * generic pointer down event for the game's canvas
     * works for touch, w8, wp8, multitouch, etc.
     * Assumes that the canvas is at 0,0 in the html page
     * Takes into account the scrolling viewport
     */
    onPointerDown: function onPointerDown(evt) {
      $log.debug('onPointerDown ' + evt.clientX + ',' + evt.clientY);

      // used by the level select screen gui.level_select_sprite
      if (gui.showing_level_select_screen) {
        if (!handlers.clickMaybe(evt.clientX, evt.clientY)) {
          $log.debug('gui.showing_level_select_screen GUI not touched');
        }
      }

      if (!viewport.instance || timer.game_over) {
        return; 
      }

      evt.preventDefault();

      var px = evt.clientX + viewport.instance.x;
      var py = evt.clientY + viewport.instance.y;
      var tx = Math.floor(px / tileData.size);
      var ty = Math.floor(py / tileData.size);

      if (!handlers.clickMaybe(px, py)) {
        tile.click(tx, ty);
      }
    },


    /**
     * Detects the availability of touch input (on tablets, etc)
     * and starts listening for pointer events as required
     */
    initMSTouchEvents: function initMSTouchEvents() {

      // no ipad drag
      document.addEventListener('touchmove', function (e) {
        e.preventDefault();
      }, false);

      if (!jaws.canvas) {
        throw "We tried to add a point event listener before the game canvas was created.";
      }
      
      jaws.canvas.addEventListener("PointerDown", handlers.onPointerDown, false);
      // in some browsers, the above does nothing: also listen for regular events
      jaws.canvas.addEventListener("mousedown", handlers.onPointerDown, false);
      // and the MS specific version, too
      jaws.canvas.addEventListener("MSPointerDown", handlers.onPointerDown, false);

      if (window.navigator.msPointerEnabled) {
        $log.debug('MS pointer events are enabled.');
        if (window.navigator.msMaxTouchPoints) {
          $log.debug('MS touches (x' + window.navigator.msMaxTouchPoints + ' points max) are available.');
        }
      }

      // dont't let any mouse/touch select things: this is a game
      document.addEventListener("selectstart", function (e) {
        e.preventDefault();
      }, false);

      // dont't let touch-and-hold (or right click) create a context menu
      document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      }, false);
      
      // don't show the hint visual for context menu either
      document.addEventListener("MSHoldVisual", function (e) {
        e.preventDefault();
      }, false);

      $log.debug('initMSTouchEvents completed.');
    }
  };

  return handlers;
});