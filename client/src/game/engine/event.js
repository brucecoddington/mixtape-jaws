angular.module('game.engine.event', [])
  
  .factory('event', function () {

    return {

      clickMaybe: function guiClickMaybe(px, py) {
        if (debugmode)
          log('guiClickMaybe ' + px + ',' + py);
        var weClickedSomething = false;
        // loop through any sprites in this list
        guiButtonSprites.filter
        (
          function (nextone) {
          return nextone.rect().collidePoint(px, py);
        }).forEach
        (
          // run the sprite's action() function if it exists
          function (nextone) {
          if (debugmode)
            log('GUI button was clicked!');
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
        if (debugmode)
          log('onPointerDown ' + evt.clientX + ',' + evt.clientY);

        // used by the level select screen levelSelectSprite
        if (showing_levelselectscreen) {
          if (!guiClickMaybe(evt.clientX, evt.clientY)) {
            if (debugmode)
              log('showing_levelselectscreen GUI not touched');
          }
        }

        if (!viewport)
          return; // clicks before game inits

        if (game_over) {
          return; // during the menu
        }

        evt.preventDefault();

        //pointerDown[evt.pointerId] = true;
        //lastPositions[evt.pointerId] = { x: evt.clientX, y: evt.clientY};
        var px = evt.clientX + viewport.x;
        var py = evt.clientY + viewport.y;
        var tx = Math.floor(px / TILESIZE);
        var ty = Math.floor(py / TILESIZE);
        //startParticleSystem(px, py); // world pixel coords

        if (!guiClickMaybe(px, py)) {
          clickTile(tx, ty);
        }

        // always change camera? moved to clicktile to avoid scrolling when gui is clicked
        // moveCamera(px,py);

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

        if (!jaws.canvas)
          throw "We tried to add a point event listener before the game canvas was created.";
        jaws.canvas.addEventListener("PointerDown", onPointerDown, false);
        // in some browsers, the above does nothing: also listen for regular events
        jaws.canvas.addEventListener("mousedown", onPointerDown, false);
        // and the MS specific version, too
        jaws.canvas.addEventListener("MSPointerDown", onPointerDown, false);

        if (window.navigator.msPointerEnabled) {
          if (debugmode)
            log('MS pointer events are enabled.');

          if (window.navigator.msMaxTouchPoints) {
            if (debugmode)
              log('MS touches (x' + window.navigator.msMaxTouchPoints + ' points max) are available.');
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

        if (debugmode)
          log('initMSTouchEvents completed.');
      }
    };
  });