angular.module('game.engine.particles', [
  'game.system.profiler',
  'game.engine.config',
  'game.ui.sprite'
])

.factory('particle', function () {

  var particle = {
    // particle system - see particleSystem.particles.png
    arrow: 4,
    fire: 5,
    energy: 6,
    build: 7,
    goal: 2,
    spawn: 3,
    arrowHit: 8,
    fireHit: 9,
    energyHit: 10,
    // we need to wait for projectiles to reach target before "exploding"
    projectileExplosionDelay: 500
  };

  return particle;
  
})

.factory('particleSystem', function ($log, profiler, particle, sprite, settings) {

  var particleSystem = {

    // simple spritesheet-based particle system
    particles_enabled: true,
    particles: undefined, // a SpriteList containing all of them
    allparticleframes: undefined, // contains every sprite in the particle spritesheet
    framesize: [64, 64], // pixel dimensions of each particle anim
    spritesheet_framecount: 32, // spritesheet frames per anim
    frame_ms: 30, // 15: 60fps - looks fine much slower too
    entity_particle_offset_y: (-1 * (sprite.entity_framesize[0] / 2)) | 0, // explosions at torso, not feet

    /**
     * spawns a spritesheet-based particle animation at these coordinates
     * implements a reuse POOL and only makes new objects when required
     */
    start: function start(x, y, particleType, destX, destY) {

      if (!particleSystem.particles_enabled) {
        return;
      }
        
      var p,
      pnum,
      pcount;

      if (!particleType) {
        particleType = Math.floor(Math.random() * 1.99999); // random cycle between the first two
      }
        
      for (pnum = 0, pcount = particleSystem.particles.length; pnum < pcount; pnum++) {
        p = particleSystem.particles.at(pnum);
        if (p && p.inactive) {
          break;
        }
      }

      // we need a new particle!
      if (!p || !p.inactive) {
        profiler.start('new particle');
        $log.debug('All particles are in use. Allocating particle #' + pcount);

        var newParticle = new jaws.Sprite({
          x : settings.farAway,
          y : settings.farAway,
          anchor : "center_center"
        });

        newParticle.inactive = true; // don't draw or animate
        newParticle.anim = []; // several kinds of animation

        var framecount = particleSystem.spritesheet_framecount;
        var allFrames = particleSystem.allparticleframes;

        // each 32 frame row of the particles.png spritesheet is one effect
        // white puff
        newParticle.anim.push(allFrames.slice(framecount * 0, framecount * 1 - 1));
        // gold star puff
        newParticle.anim.push(allFrames.slice(framecount * 1, framecount * 2 - 1));
        // smoke: particle.goal
        newParticle.anim.push(allFrames.slice(framecount * 2, framecount * 3 - 1));
        // burst: particle.spawn
        newParticle.anim.push(allFrames.slice(framecount * 3, framecount * 4 - 1));

        // projectile particle systems are half as long
        // arrow
        newParticle.anim.push(allFrames.slice(framecount * 4, framecount * 5 - 1 - (framecount / 2)));
        // fire
        newParticle.anim.push(allFrames.slice(framecount * 5, framecount * 6 - 1 - (framecount / 2)));
        // energy
        newParticle.anim.push(allFrames.slice(framecount * 6, framecount * 7 - 1 - (framecount / 2)));

        // coins: particle.build
        newParticle.anim.push(allFrames.slice(framecount * 7, framecount * 8 - 1));

        // arrow hit
        newParticle.anim.push(allFrames.slice(framecount * 8, framecount * 9 - 1));
        // fire hit
        newParticle.anim.push(allFrames.slice(framecount * 9, framecount * 10 - 1));
        // energy hit
        newParticle.anim.push(allFrames.slice(framecount * 10, framecount * 11 - 1));

        // remember this new particle in our system and reuse
        particleSystem.particles.push(newParticle);
        p = newParticle;
        profiler.end('new particle');
      }

      if (p && p.inactive) {
        p.x = x;
        p.y = y;
        p.inactive = false;
        p.animation = p.anim[particleType]; // use selected anim
        p.animation.index = 0; // start anim over again
        p.animation.last_tick = (new Date()).getTime();
        p.animation.sum_tick = 0;
        p.setImage(p.animation.next());

        // optionally moving particles
        if (destX && destY) {
          $log.debug('Creating a moving particle going to ' + destX + ',' + destY);
          p.moving = true;
          p.destX = destX;
          p.destY = destY;

          sprite.lookAt(p, destX, destY);

          p.speedX = (destX - x) / particleSystem.spritesheet_framecount;
          p.speedY = (destY - y) / particleSystem.spritesheet_framecount;
        } else {
          p.moving = false;
        }
      }
    },

    clear: function clear() {
      $log.debug('particleSystem.clear');

      angular.forEach(particleSystem.particles, function (p) {
        p.x = p.y = settings.farAway; // throw offscreen
        p.inactive = true;
      });
    },

    /**
     * steps the particle effects simulation
     */
    update: function update() {
      if (!particleSystem.particles_enabled) {
        return;
      }
        
      // animate the particles
      angular.forEach(particleSystem.particles, function (p) {
        if (!p.inactive) {

          // moving particleSystem.particles
          if (p.moving) {
            p.x += p.speedX;
            p.y += p.speedY;
          }

          if (p.animation.atLastFrame()) {
            //if (debugmode) log('particle anim ended');
            p.x = p.y = settings.farAway; // throw offscreen
            p.inactive = true;
          } else {
            p.setImage(p.animation.next());
          }
        }
      });
    }
  };

  return particleSystem;
});