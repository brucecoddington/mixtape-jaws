angular.module('game.ui.build', [

])

.factory('buildMenu', function (settings) {
  var offscreen = settings.farAway;

  return {
    // The build menu
    // the ring build menu overlay only appears over buildable land we click
    active: false,
    
    choice1_tileX: offscreen,
    choice1_tileY: offscreen,
    choice2_tileX: offscreen,
    choice2_tileY: offscreen,
    choice3_tileX: offscreen,
    choice3_tileY: offscreen,

    // where the next tower will be placed
    pending_pixelX: offscreen,
    pending_pixelY: offscreen,
    pending_tileX: offscreen,
    pending_tileY: offscreen,
    
    // the sprites used by the build menu:
    sprite: null,
    
    // the overlays that obscure items we can't afford
    overlay1: null,
    overlay2: null,
    overlay3: null,
    overlay_height: 50, //pixels
    
    // the glowing yellow outlines on clickable items
    button_highlight_image_on: undefined, // images
    button_highlight_image_off: undefined,
    button_highlight: [], // sprites we can click,

    move: function move(px, py) {
      if (!buildMenu.sprite) {
        return;
      }

      buildMenu.sprite.moveTo(px, py);
      buildMenu.overlay1.moveTo(px, py - 40);
      buildMenu.button_highlight[0].moveTo(px, py - 40 + 8);
      buildMenu.overlay2.moveTo(px - 64, py + 25);
      buildMenu.button_highlight[1].moveTo(px - 64, py + 25 + 7);
      buildMenu.overlay3.moveTo(px + 64, py + 25);
      buildMenu.button_highlight[2].moveTo(px + 64, py + 25 + 7);
    },

    off: function off() {
      $log.debug('Turning off the buildMenu');
      
      buildMenu.active = false;
      buildMenu.move(offscreen, offscreen);
      buildMenu.choice1_tileX = offscreen;
      buildMenu.choice1_tileY = offscreen;
      buildMenu.choice2_tileX = offscreen;
      buildMenu.choice2_tileY = offscreen;
      buildMenu.choice3_tileX = offscreen;
      buildMenu.choice3_tileY = offscreen;
      buildMenu.pending_pixelX = offscreen;
      buildMenu.pending_pixelY = offscreen;
      buildMenu.pending_tileX = offscreen;
      buildMenu.pending_tileY = offscreen;
    }
  };
});