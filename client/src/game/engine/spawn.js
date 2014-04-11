angular.module('game.engine.spawn', [])

  .factory('spawner', function () {

    return {

      /**
       * Adds a new entity to the world
       * returns the sprite
       */
      spawn: function spawnEntity(worldx, worldy, race, team) {

        profile_start('spawnEntity');

        // handle unknown races by looping over 1,2,3,4
        if (race < 1)
          race = ENTITY_MIN_RACE;
        if (race > 4)
          race = ENTITY_MAX_RACE;

        if (debugmode)
          log('spawnEntity ' + worldx + ',' + worldy + ' Race ' + race + ' Team ' + team);

        num_entities++;

        var anentity = new jaws.Sprite({
            x : worldx,
            y : worldy,
            anchor : "center_bottom"
          });

        // we can reuse some healthbar sprites
        if (!healthbarImage.length) {
          if (debugmode)
            log('Lazy init healthbar images');
          healthbarImage[0] = chopImage(jaws.assets.get("entities.png"), 32, 0, 32, 8);
          healthbarImage[1] = chopImage(jaws.assets.get("entities.png"), 32, 8, 32, 8);
          healthbarImage[2] = chopImage(jaws.assets.get("entities.png"), 32, 16, 32, 8);
          healthbarImage[3] = chopImage(jaws.assets.get("entities.png"), 32, 24, 32, 8);
        }

        // all image frames for all entities
        // we currently use four different units: 1..4
        if (!entityanimation.length) {
          if (debugmode)
            log('Lazy init entityanimations');
          if (debugmode)
            log("Chopping up unit1 animation spritesheet...");
          entityanimation[1] = new jaws.Animation({
              sprite_sheet : jaws.assets.get("unit1.png"),
              orientation : 'right',
              frame_size : entity_framesize,
              frame_duration : entity_animation_framerate
            });
          if (debugmode)
            log("Chopping up unit2 animation spritesheet...");
          entityanimation[2] = new jaws.Animation({
              sprite_sheet : jaws.assets.get("unit2.png"),
              orientation : 'right',
              frame_size : entity_framesize,
              frame_duration : entity_animation_framerate
            });
          if (debugmode)
            log("Chopping up unit3 animation spritesheet...");
          entityanimation[3] = new jaws.Animation({
              sprite_sheet : jaws.assets.get("unit3.png"),
              orientation : 'right',
              frame_size : entity_framesize,
              frame_duration : entity_animation_framerate
            });
          if (debugmode)
            log("Chopping up unit4 animation spritesheet...");
          entityanimation[4] = new jaws.Animation({
              sprite_sheet : jaws.assets.get("unit4.png"),
              orientation : 'right',
              frame_size : entity_framesize,
              frame_duration : entity_animation_framerate
            });
        }

        if (!towerImages.length) {
          if (debugmode)
            log('Lazy init towerImages');
          towerImages[1] = chopImage(jaws.assets.get("entities.png"), 0, 32, 64, 96);
          towerImages[2] = chopImage(jaws.assets.get("entities.png"), 64, 32, 64, 96);
          towerImages[3] = chopImage(jaws.assets.get("entities.png"), 128, 32, 64, 96);
        }

        if (team == TEAM_BAD) // then we want walking avatars
        {
          // all animations used by our hero
          // we make new anims for each entity so they aren't synched the same
          anentity.idle_anim = entityanimation[race].slice(0, 1);
          anentity.attack_anim = entityanimation[race].slice(0, 1);
          anentity.move_n = entityanimation[race].slice(0, 7);
          anentity.move_w = entityanimation[race].slice(8, 15);
          anentity.move_s = entityanimation[race].slice(16, 23);
          anentity.move_e = entityanimation[race].slice(24, 31);
          //anentity.deathanim = entityanimation[race].slice(32, 31);
          anentity.currentAnimation = anentity.move_n;
          anentity.setImage(anentity.move_n.frames[0]);
          anentity.speed = BASE_ENTITY_SPEED;
          // for now, walkers have no weapon!
          //anentity.weapon = new GameWeapon();
          anentity.weapon = null;
          anentity.enemySpriteList = null;
        } else // a tower - goodguy player
        {
          anentity.setImage(towerImages[race]);
          // the artwork needs a nudge since it is taller - fixme todo: hardcoded tower sprite size
          anentity.anchor_y = 0.75;
          anentity.cacheOffsets();
          anentity.speed = 0; // player entities never move in this game (but they could in yours!)
          anentity.weapon = new GameWeapon(race);
          anentity.enemySpriteList = teams[TEAM_BAD];
        }

        // callback functions
        anentity.entitytype = race; // see above

        // teams
        anentity.team = team;

        // defaults
        anentity.active = true;
        anentity.health = 100;

        // health bar:
        anentity.healthbarsprite = new jaws.Sprite({
            x : anentity.x,
            y : anentity.y + HEALTHBAROFFSET,
            anchor : "center_bottom"
          });
        anentity.healthbarsprite.setImage(healthbarImage[0]);
        healthbarsprites.push(anentity.healthbarsprite);

        // store this sprite for easy access and iteration during update and draw
        entities.push(anentity);

        // optimization for collision detection, etc.
        teams[team].push(anentity);

        profile_end('spawnEntity');

        return anentity;

      },

      remove: function removeEntity(victim) {
        if (debugmode)
          log('removeEntity');
        victim.active = false; // ready to respawn/reuse
        // stop drawing and updating
        entities.remove(victim);
        // stop checking collisions
        teams[victim.team].remove(victim);
        // stop drawing its healthbar
        if (victim.healthbarsprite)
          healthbarsprites.remove(victim.healthbarsprite);
        // check if we completed the level (eg all badguys destroyed?) fixme todo: maybe just current ones: waves
        checkLevelComplete();
      }

    };
  });