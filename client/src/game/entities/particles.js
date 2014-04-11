angular.module('game.entities.particles', [])
  .value('particleData', {
    // particle system - see particles.png
    particleARROW: 4,
    particleFIRE: 5,
    particleENERGY: 6,
    particleBUILD: 7,
    particleGOAL: 2,
    particleSPAWN: 3,
    particleARROWHIT: 8,
    particleFIREHIT: 9,
    particleENERGYHIT: 10,
    // spawn fireballs/arrows from window, not ground
    tower_projectile_offsetY: -32,
    // we need to wait for projectiles to reach target before "exploding"
    PROJECTILE_EXPLOSION_DELAY: 500
  })

  .value('spritesheet', {
    // simple spritesheet-based particle system
    particles_enabled: true,
    particles: undefined, // a SpriteList containing all of them
    allparticleframes: undefined, // contains every sprite in the particle spritesheet
    particle_framesize: [64, 64], // pixel dimensions of each particle anim
    particle_spritesheet_framecount: 32, // spritesheet frames per anim
    PARTICLE_FRAME_MS: 30, // 15: 60fps - looks fine much slower too
    ENTITY_PARTICLE_OFFSETY: (-1 * (entity_framesize[0] / 2)) | 0 // explosions at torso, not feet
  });