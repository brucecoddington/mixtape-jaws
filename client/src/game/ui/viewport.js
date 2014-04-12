angular.module('game.ui.viewport', [])

.factory('viewport', function ($window) {

  var viewport = {
    max_x: 10000, // these defaults are overwritten...
    max_y: 1000, // ...depending on map data

    init: function init() {
      // set up the chase camera view
      viewport.instance = new jaws.Viewport({
        max_x : viewport.max_x,
        max_y : viewport.max_y
      });

      jaws.activeviewport = viewport.instance; // resize events need this in global scope
    }
  };

  return viewport;
});