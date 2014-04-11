angular.module('game.gui.build', [])

  .factory('buildMenu', function () {

    return {
      // The build menu
      // the ring build menu overlay only appears over buildable land we click
      buildMenuActive: false,
      // we click neighbor tiles to actually build when menu is open fixme todo use sprite collide?
      FAR_AWAY: -999999,
      buildChoice1tileX: FAR_AWAY,
      buildChoice1tileY: FAR_AWAY,
      buildChoice2tileX: FAR_AWAY,
      buildChoice2tileY: FAR_AWAY,
      buildChoice3tileX: FAR_AWAY,
      buildChoice3tileY: FAR_AWAY,
      // where the next tower will be placed
      buildPendingPixelX: FAR_AWAY,
      buildPendingPixelY: FAR_AWAY,
      buildPendingTileX: FAR_AWAY,
      buildPendingTileY: FAR_AWAY,
      // the sprites used by the build menu:
      buildMenuSprite: null,
      // the overlays that obscure items we can't afford
      buildMenuOverlay1: null,
      buildMenuOverlay2: null,
      buildMenuOverlay3: null,
      buildMenuOverlayHeight: 50, //pixels
      // the glowing yellow outlines on clickable items
      buttonHighlightImageON: undefined, // images
      buttonHighlightImageOFF: undefined,
      buttonHighlight: [], // sprites we can click,

      move: function buildMenuMove(px, py) {
        if (!buildMenuSprite)
          return;
        buildMenuSprite.moveTo(px, py);
        buildMenuOverlay1.moveTo(px, py - 40);
        buttonHighlight[0].moveTo(px, py - 40 + 8);
        buildMenuOverlay2.moveTo(px - 64, py + 25);
        buttonHighlight[1].moveTo(px - 64, py + 25 + 7);
        buildMenuOverlay3.moveTo(px + 64, py + 25);
        buttonHighlight[2].moveTo(px + 64, py + 25 + 7);
      },

      off: function buildMenuOFF() {
        if (debugmode)
          log('Turning off the buildMenu');
        buildMenuActive = false;
        buildMenuMove(FAR_AWAY, FAR_AWAY);
        buildChoice1tileX = FAR_AWAY;
        buildChoice1tileY = FAR_AWAY;
        buildChoice2tileX = FAR_AWAY;
        buildChoice2tileY = FAR_AWAY;
        buildChoice3tileX = FAR_AWAY;
        buildChoice3tileY = FAR_AWAY;
        buildPendingPixelX = FAR_AWAY;
        buildPendingPixelY = FAR_AWAY;
        buildPendingTileX = FAR_AWAY;
        buildPendingTileY = FAR_AWAY;
      }
    };
  });