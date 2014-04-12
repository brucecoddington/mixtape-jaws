angular.module('game.entities.game', [])

  .factory('GameEntity', function (entityType) {
    
    return function GameEntity(gameplay.startx, gameplay.starty) {
      if (debugmode) { log('Creating a new GameEntity'); }

      this.self = this; // just in case we lose the this. context (events)
      this.name = ''; // a string name we can react to
      this.team = 0; // 0 = the goodguys (player's team), 1+ = the badguys
      this.type = EntityType.FODDER; // an int expressing which type of entity it is
      this.sprite = null; // a jawsjs sprite entity with x,y and other props
      this.weapon = 0; // a WeaponEffect bit mask
      this.speed = 0; // how many pixels per sim frame to we move? (tower=0)
      this.health = 100; // how damaged are we? 0=dead
      this.shield = 1.0; // multiplier for damage (0.5 = 50% less damage)
      this.cost = 100; // how much gold it costs to buy this
      this.regeneration = 0; // how much health do we regain every sim frame
      this.destination = [0, 0]; // where we want to move to
      this.path = null; // a 2d array of coordinates [x,y]
      this.moveParticles = 0; // which particle system to trigger when we walk
      this.hurtParticles = 0; // sparks/smoke emitted when we get damaged
      this.dieParticles = 0; // explosion when we are destroyed
      this.birthday = 0; // a timestamp of when we were first spawned
      this.age = 0; // each sim step this gets bigger (ms)
      this.deathday = 0; // if not 0, when age > this it dies automatically

      var sprite_framesize = [128, 96]; // pixel dimensions of all entity sprites

      this.sprite = new jaws.Sprite({ x: gameplay.startx, y: gameplay.starty, anchor: "center_center", flipped: true });
      if (debugmode) { log("Chopping up player animation spritesheet..."); }
      this.sprite.animation = new jaws.Animation({ sprite_sheet: jaws.assets.get("player.png"), frame_size: sprite_framesize, frame_duration: 75 });
      this.sprite.move_anim = this.sprite.animation.slice(0, 7);
      this.sprite.setImage(this.sprite.animation.frames[0]);

      // stuff it into the SpriteList pool - needs to exist already via spawnEntities()
      entities.push(this.sprite);
    };
  });