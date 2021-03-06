angular.module('game.engine.spawn', [
  'game.system.profiler',
  'game.engine.level',
  'game.ui.sprite',
  'game.system.settings.entities',
  'game.entities.weapon'
])

.value('walker', {
  // our walking units
  entity_animation_framerate: 100, // ms per frame (8 frame walkcycle)
  entity_animation: [], // [1..3] the sprite sheet for our four walking units, split into frames
  include_dead_bodies: true // if false, they simply dissappear when killed
})

.factory('spawner', function ($injector, $log, profiler, sprite, walker, Weapon, team) {

  return {

    /**
     * Adds a new entity to the world
     * returns the sprite
     */
    spawn: function spawnEntity(worldx, worldy, race, spawnTeam) {

      profiler.start('spawnEntity');

      // handle unknown races by looping over 1,2,3,4
      if (race < 1) {
        race = enemyWave.minRace;
      }
        
      if (race > 4) {
        race = enemyWave.maxRace;
      }

      $log.debug('spawnEntity ' + worldx + ',' + worldy + ' Race ' + race + ' Team ' + spawnTeam);

      sprite.num_entities++;

      var anentity = new jaws.Sprite({
        x : worldx,
        y : worldy,
        anchor : "center_bottom"
      });

      // we can reuse some healthbar sprites
      if (!sprite.healthbar_image.length) {
        $log.debug('Lazy init healthbar images');
        sprite.healthbar_image[0] = sprite.chop(jaws.assets.get("map/entities.png"), 32, 0, 32, 8);
        sprite.healthbar_image[1] = sprite.chop(jaws.assets.get("map/entities.png"), 32, 8, 32, 8);
        sprite.healthbar_image[2] = sprite.chop(jaws.assets.get("map/entities.png"), 32, 16, 32, 8);
        sprite.healthbar_image[3] = sprite.chop(jaws.assets.get("map/entities.png"), 32, 24, 32, 8);
      }

      // all image frames for all entities
      // we currently use four different units: 1..4
      if (!walker.entity_animation.length) {
        $log.debug('Lazy init walker.entity_animations');
        $log.debug("Chopping up unit1 animation spritesheet...");

        walker.entity_animation[1] = new jaws.Animation({
          sprite_sheet : jaws.assets.get("sprite/unit1.png"),
          orientation : 'right',
          frame_size : sprite.entity_framesize,
          frame_duration : walker.entity_animation_framerate
        });

        $log.debug("Chopping up unit2 animation spritesheet...");
        
        walker.entity_animation[2] = new jaws.Animation({
          sprite_sheet : jaws.assets.get("sprite/unit2.png"),
          orientation : 'right',
          frame_size : sprite.entity_framesize,
          frame_duration : walker.entity_animation_framerate
        });

        $log.debug("Chopping up unit3 animation spritesheet...");
        
        walker.entity_animation[3] = new jaws.Animation({
          sprite_sheet : jaws.assets.get("sprite/unit3.png"),
          orientation : 'right',
          frame_size : sprite.entity_framesize,
          frame_duration : walker.entity_animation_framerate
        });

        $log.debug("Chopping up unit4 animation spritesheet...");
        
        walker.entity_animation[4] = new jaws.Animation({
          sprite_sheet : jaws.assets.get("sprite/unit4.png"),
          orientation : 'right',
          frame_size : sprite.entity_framesize,
          frame_duration : walker.entity_animation_framerate
        });
      }

      if (!sprite.tower_images.length) {
        $log.debug('Lazy init sprite.tower_images');
        sprite.tower_images[1] = sprite.chop(jaws.assets.get("map/entities.png"), 0, 32, 64, 96);
        sprite.tower_images[2] = sprite.chop(jaws.assets.get("map/entities.png"), 64, 32, 64, 96);
        sprite.tower_images[3] = sprite.chop(jaws.assets.get("map/entities.png"), 128, 32, 64, 96);
      }

      if (spawnTeam === team.bad) { // then we want walking avatars
        // we make new anims for each entity so they aren't synched the same
        anentity.idle_anim = walker.entity_animation[race].slice(0, 1);
        anentity.attack_anim = walker.entity_animation[race].slice(0, 1);
        anentity.move_n = walker.entity_animation[race].slice(0, 7);
        anentity.move_w = walker.entity_animation[race].slice(8, 15);
        anentity.move_s = walker.entity_animation[race].slice(16, 23);
        anentity.move_e = walker.entity_animation[race].slice(24, 31);
        //anentity.deathanim = walker.entity_animation[race].slice(32, 31);
        anentity.currentAnimation = anentity.move_n;
        anentity.setImage(anentity.move_n.frames[0]);
        anentity.speed = sprite.base_entity_speed;
        // for now, walkers have no weapon!
        //anentity.weapon = new Weapon();
        anentity.weapon = null;
        anentity.enemySpriteList = null;

      } else {// a tower - goodguy player
        
        anentity.setImage(sprite.tower_images[race]);
        // the artwork needs a nudge since it is taller - fixme todo: hardcoded tower sprite size
        anentity.anchor_y = 0.75;
        anentity.cacheOffsets();
        anentity.speed = 0; // player entities never move in this game (but they could in yours!)
        anentity.weapon = new Weapon(race);
        anentity.enemySpriteList = sprite.teams[team.bad];
      }

      // callback functions
      anentity.entitytype = race; // see above

      // teams
      anentity.team = spawnTeam;

      // defaults
      anentity.active = true;
      anentity.health = 100;

      // health bar:
      anentity.healthbar_sprite = new jaws.Sprite({
        x : anentity.x,
        y : anentity.y + sprite.healthbar_offset,
        anchor : "center_bottom"
      });

      anentity.healthbar_sprite.setImage(sprite.healthbar_image[0]);
      sprite.healthbar_sprites.push(anentity.healthbar_sprite);

      // store this sprite for easy access and iteration during update and draw
      sprite.entities.push(anentity);

      // optimization for collision detection, etc.
      sprite.teams[spawnTeam].push(anentity);

      profiler.end('spawnEntity');

      return anentity;

    },

    remove: function removeEntity(victim) {
      $log.debug('removeEntity');
      victim.active = false; // ready to respawn/reuse
      
      // stop drawing and updating
      sprite.entities.remove(victim);
      
      // stop checking collisions
      sprite.teams[victim.team].remove(victim);
      
      // stop drawing its healthbar
      if (victim.healthbar_sprite) {
        sprite.healthbar_sprites.remove(victim.healthbar_sprite);
      }
      
      // check if we completed the level (eg all badguys destroyed?) fixme todo: maybe just current ones: waves
      $injector.get('level').checkComplete();
    }

  };
});