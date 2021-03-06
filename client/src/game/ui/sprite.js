angular.module('game.ui.sprite', [
  'game.system.settings.ui',
  'game.system.settings.entities'
])

.factory('sprite', function (tileData, team) {

  var sprite = {

    game_objects: undefined, // a spritelist of dummy objects - just rendered sprites with no AI
    button_sprites: undefined, // a spritelist of sprites that you can click - each has a .action() callback - see event.clickMaybe()

    // sprites aplenty
    entities: [], // a sprite list filled with entities
    teams: [], // an array of spritelists, index is team number
    healthbar_sprites: [], // used and updated by entities
    healthbar_image: [], // an array of images shared by all healthbar sprites
    healthbar_offset: -28, // pixels offset in Y from parent entity

    tower_images: [], // three images used for building towers in spawner.spawn()

    base_entity_speed: 0.5, // pixels per simulation step (1/60th sec) - in debug mode, move FAST for testing
    entity_framesize: [32, 32], // pixel dimensions of the entity sprite (if any)
    num_entities: 0, // depends on the entities layer in the level data
    sprite_sheet: undefined, // the level tile map's data sprite sheet image
    use_level_sprite_sheet: false, // optimizaed out: we preredner the entire map as a png now

    init : function () {
      // init the sprite sheet tiles
      if (sprite.use_level_sprite_sheet) {
        if (!sprite.sprite_sheet) {
          $log.debug("Chopping up tiles spritesheet...");

          sprite.sprite_sheet = new jaws.SpriteSheet({
            image : "tiles.png",
            frame_size : [tileData.size, tileData.size],
            orientation : 'right'
          });
        }
      }

      // a generic sprite list for everything we need to draw first (like the terrainSprite)
      if (!sprite.game_objects) {
        sprite.game_objects = new jaws.SpriteList();
      }

      // reset in between play sessions - a list of clickable buttons
      sprite.button_sprites = new jaws.SpriteList(); /// see handlers.clickMaybe()

      sprite.entities = new jaws.SpriteList();
      sprite.teams[team.bad] = new jaws.SpriteList();
      sprite.teams[team.good] = new jaws.SpriteList();
      sprite.healthbar_sprites = new jaws.SpriteList();
    },

    /**
     * Extracts a portion of an image to a new canvas
     * Used for chopping up the GUI spritesheet
     * because each item has a different size and thus
     * the jaws.Spritesheet class is insufficient
     */
    chop: function chop(image, x, y, width, height) {
      if (!image) {
        throw "sprite.chop with an undefined image";
      }

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
    extract: function extract(fromthisimage, x, y, width, height, params) {
      params = params || {};
      var extracted = sprite.chop(fromthisimage, x, y, width, height);
      params.image = extracted;
      return new jaws.Sprite(params);
    },

    lookAt: function lookAt(spr, x, y) {
      if (!spr || isNaN(x) || isNaN(y)) {
        $log.error("ERROR: Empty value passed to the lookAt function");
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
    }
  };

  return sprite;
});