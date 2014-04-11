angular.module('game.gui.sprite', [])

  .factory('sprite', function () {

    return {

      game_objects: undefined, // a spritelist of dummy objects - just rendered sprites with no AI
      guiButtonSprites: undefined, // a spritelist of sprites that you can click - each has a .action() callback - see guiClickMaybe()

      // sprites aplenty
      entities: [], // a sprite list filled with entities
      teams: [], // an array of spritelists, index is team number
      healthbarsprites: [], // used and updated by entities
      healthbarImage: [], // an array of images shared by all healthbar sprites
      HEALTHBAROFFSET: -28, // pixels offset in Y from parent entity

      towerImages: [], // three images used for building towers in spawnEntity()

      BASE_ENTITY_SPEED: 0.5, // pixels per simulation step (1/60th sec) - in debug mode, move FAST for testing
      entity_framesize: [32, 32], // pixel dimensions of the entity sprite (if any)
      num_entities: 0, // depends on the entities layer in the level data
      sprite_sheet: undefined, // the level tile map's data sprite sheet image
      use_level_sprite_sheet: false, // optimizaed out: we preredner the entire map as a png now

      /**
       * Extracts a portion of an image to a new canvas
       * Used for chopping up the GUI spritesheet
       * because each item has a different size and thus
       * the jaws.Spritesheet class is insufficient
       */
      chop: function chopImage(image, x, y, width, height) {
        if (!image)
          throw "chopImage with an undefined image";
        var cut = document.createElement("canvas");
        cut.width = width;
        cut.height = height;
        var ctx = cut.getContext("2d");
        ctx.drawImage(image, x, y, width, height, 0, 0, cut.width, cut.height);
        return cut;
      },

      /**
       * returns a jaws sprite with pixels extracted
       * from a smaller section of the source image
       */
      extract: function extractSprite(fromthisimage, x, y, width, height, params) {
        params = params || {};
        var extracted = chopImage(fromthisimage, x, y, width, height);
        params.image = extracted;
        return new jaws.Sprite(params);
      },

      lookAt: function lookAt(spr, x, y) {
        if (!spr || isNaN(x) || isNaN(y)) {
          if (debugmode)
            log("ERROR: Empty value passed to the lookAt function");
          return;
        }

        // angle in radians
        //var angle = Math.atan2(y - spr.y, x - spr.x);

        // angle in degrees
        var angle = Math.atan2(y - spr.y, x - spr.x) * 180 / Math.PI;

        spr.rotateTo(angle); // instant

        /*
        // smooth - BUGGY: turns the long way around then the 0deg-360deg barrier is crossed
        var flip = 1;
        var rotationSpeed = 5;
        if (debugmode) log('lookAt target=' + Math.round(angle) + ' current=' + Math.round(spr.angle));
        if (spr.angle > angle) spr.rotate(flip * -rotationSpeed);
        else if (spr.angle < angle) spr.rotate(flip * rotationSpeed);
        //if (spr.angle > 360) spr.angle -= 360;
        //if (spr.angle < 0) spr.angle += 360;
         */

      },

        /**
       * Changes the sprites used by a SpriteList (score, time, counter, etc) eg. 00000FAR_AWAY9
       * updateGUIsprites cannot handle negative numbers: only 0..9 in the spritesheet
       */
      updateAll: function updateGUIsprites(gui, num) {
        if (!gui_enabled)
          return;
        // individual digits
        //if (debugmode) log('updateGUIsprites: using ' + gui.length + ' digit sprites to display: ' + num);
        var digitcount = 0;
        var digit = 0;
        var digitsprite = gui.at(digitcount + 1); // +1 because the "label" is the first sprite
        while (digitsprite) {
          digit = Math.floor(num % 10);
          if (digit < 0)
            digit = 0; // eg if num is -1
          num = Math.floor(num / 10);
          digitsprite.setImage(fontSpriteSheet.frames[digit]);
          digitcount++;
          digitsprite = gui.at(digitcount + 1);
        }
      },

      /**
       * Changes the sprites used by the GoldGUI,
       * counting by 1 each call until we reach player_Gold
       */
      updateGold: function updateGoldGUI() {
        if (displayedGold == player_Gold)
          return;

        // don't fall too far behind
        if (Math.abs(player_Gold - displayedGold) > 200)
          displayedGold = player_Gold;
        else {
          if (player_Gold > displayedGold)
            displayedGold++;
          else
            displayedGold--;
        }

        updateGUIsprites(GoldGUI, displayedGold);
      }
    };
  });