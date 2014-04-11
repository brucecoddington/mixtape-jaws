angular.module('game.gui.viewport', [])

.factory('viewport', function () {

  return {
    // viewport
    viewport: undefined, // the visible game world that scrolls around
    viewport_max_x: 10000, // these defaults are overwritten...
    viewport_max_y: 1000, // ...depending on map data

    /**
     * this function is used to detect when the screen size has changed
     * due to rotation of a tablet or going into "snapped" view
     * it resizes the game canvas and pauses the game
     */
    onResize: function onResize(e) {
      if (debugmode)
        log('onResize!');
      if (debugmode)
        log('window size is now ' + window.innerWidth + 'x' + window.innerHeight);

      if (!window.jaws)
        return; // before we've initialized?

      // for example, on a 1366x768 tablet, swiped to the side it is 320x768
      jaws.canvas.width = window.innerWidth;
      jaws.canvas.height = window.innerHeight;
      jaws.width = jaws.canvas.width;
      jaws.height = jaws.canvas.height;
      if (viewport)
        viewport.width = jaws.canvas.width;
      if (viewport)
        viewport.height = jaws.canvas.height;

      // move the gui elements around
      liquidLayoutGUI();

      // wait for the user to be ready to play
      // fixme todo - in BROWSER this can make unpausing a problem! FIXME TODO
      // only for snapped view and other small displays
      if (window.innerWidth < 321) {
        pauseGame(true);
      } else {
        pauseGame(false);
      }
    }
  };
});