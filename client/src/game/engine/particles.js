angular.module('game.engine.particles', [])

  .factory('particleSystem', function () {

    return {
        /**
       * spawns a spritesheet-based particle animation at these coordinates
       * implements a reuse POOL and only makes new objects when required
       */
      start: function startParticleSystem(x, y, particleType, destX, destY) {

        if (!particles_enabled)
          return;

        var p,
        pnum,
        pcount;
        if (!particleType)
          particleType = Math.floor(Math.random() * 1.99999); // random cycle between the first two
        for (pnum = 0, pcount = particles.length; pnum < pcount; pnum++) {
          p = particles.at(pnum);
          if (p && p.inactive) {
            break;
          }
        }

        // we need a new particle!
        if (!p || !p.inactive) {
          profile_start('new particle');
          if (debugmode > 1)
            log('All particles are in use. Allocating particle #' + pcount);
          var particle = new jaws.Sprite({
              x : FAR_AWAY,
              y : FAR_AWAY,
              anchor : "center_center"
            });
          particle.inactive = true; // don't draw or animate
          particle.anim = []; // several kinds of animation

          // each 32 frame row of the particles.png spritesheet is one effect
          // white puff
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 0, particle_spritesheet_framecount * 1 - 1));
          // gold star puff
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 1, particle_spritesheet_framecount * 2 - 1));
          // smoke: particleGOAL
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 2, particle_spritesheet_framecount * 3 - 1));
          // burst: particleSPAWN
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 3, particle_spritesheet_framecount * 4 - 1));

          // projectile particle systems are half as long
          // arrow
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 4, particle_spritesheet_framecount * 5 - 1 - (particle_spritesheet_framecount / 2)));
          // fire
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 5, particle_spritesheet_framecount * 6 - 1 - (particle_spritesheet_framecount / 2)));
          // energy
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 6, particle_spritesheet_framecount * 7 - 1 - (particle_spritesheet_framecount / 2)));

          // coins: particleBUILD
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 7, particle_spritesheet_framecount * 8 - 1));

          // arrow hit
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 8, particle_spritesheet_framecount * 9 - 1));
          // fire hit
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 9, particle_spritesheet_framecount * 10 - 1));
          // energy hit
          particle.anim.push(allparticleframes.slice(particle_spritesheet_framecount * 10, particle_spritesheet_framecount * 11 - 1));

          /*
          var pexplosion0 = allparticleframes.slice(0, particle_spritesheet_framecount - 1); // first row
          particle.anim.push(pexplosion0); // store a new kind of animation
          // another 32 frame animation)
          var pexplosion1 = allparticleframes.slice(particle_spritesheet_framecount, particle_spritesheet_framecount * 2 - 1); // second row
          particle.anim.push(pexplosion1);
          // 16 frame anims
          var pexplosion2 = allparticleframes.slice(32 + 32, 47 + 32);
          particle.anim.push(pexplosion2);
          var pexplosion3 = allparticleframes.slice(48 + 32, 63 + 32);
          particle.anim.push(pexplosion3);
          var pexplosion4 = allparticleframes.slice(64 + 32, 79 + 32);
          particle.anim.push(pexplosion4);
          var pexplosion5 = allparticleframes.slice(80 + 32, 95 + 32);
          particle.anim.push(pexplosion5);

          // projectile moving particles
          // arrow, fire, energy, coins
          var pexplosion6 = allparticleframes.slice(160, 191);
          particle.anim.push(pexplosion6);
          var pexplosion7 = allparticleframes.slice(192, 223);
          particle.anim.push(pexplosion7);
          var pexplosion8 = allparticleframes.slice(224, 255);
          particle.anim.push(pexplosion8);
          var pexplosion9 = allparticleframes.slice(256, 287);
          particle.anim.push(pexplosion8);
           */

          // remember this new particle in our system and reuse
          particles.push(particle);
          p = particle;
          profile_end('new particle');
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
            if (debugmode)
              log('Creating a moving particle going to ' + destX + ',' + destY);
            p.moving = true;
            p.destX = destX;
            p.destY = destY;
            lookAt(p, destX, destY);
            p.speedX = (destX - x) / particle_spritesheet_framecount;
            p.speedY = (destY - y) / particle_spritesheet_framecount;
          } else {
            p.moving = false;
          }

        }

      },

      clear: function clearParticles() {
        if (debugmode)
          log('clearParticles');
        particles.forEach(function (p) {
          p.x = p.y = FAR_AWAY; // throw offscreen
          p.inactive = true;
        });
      },

      /**
       * steps the particle effects simulation
       */
      update: function updateParticles() {
        if (!particles_enabled)
          return;
        // animate the particles
        particles.forEach(
          function (p) {
          if (!p.inactive) {

            // moving particles
            if (p.moving) {
              p.x += p.speedX;
              p.y += p.speedY;
            }

            if (p.animation.atLastFrame()) {
              //if (debugmode) log('particle anim ended');
              p.x = p.y = FAR_AWAY; // throw offscreen
              p.inactive = true;
            } else {
              p.setImage(p.animation.next());
            }
          }
        });
      }
    };
  });