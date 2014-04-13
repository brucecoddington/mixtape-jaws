angular.module('game.entities.weapon', [
  'game.engine.particles'
])
  
  .value('weaponType', {
    // maps to particle animation number (5=arrows, 6=flame, 7=energy)
    arrows: 1,
    fire: 2,
    energy: 3
  })

  .value('damageType', {
    physical: 1,
    magical: 2,
    slow: 3
  })

  .factory('Weapon', function (weaponType, damageType, particle) {
  
    return function Weapon(type) {
      this.self = this;
      this.damage = 25; // + or -: imagine healing towers?
      this.radius = 200; // attack range
      this.speed = 0; // + or -
      this.shootDelay = 3000; // time between shots
      this.shootDelayExtraVariance = 0;

      switch (type) {
      case weaponType.fire:
        this.projectilenumber = particle.fire;
        this.damage = 40; // three hits to kill
        this.damagetype = damageType.magical;
        this.particleHit = particle.fireHit;
        this.soundEffectName = 'shootFire';
        break;
      case weaponType.energy:
        this.projectilenumber = particle.energy;
        this.damage = 75; // two hits to kill
        this.damagetype = damageType.slow;
        this.particleHit = particle.energyHit;
        this.soundEffectName = 'hitEnergy';
        break;
      default: // case weaponType.arrows:
        this.projectilenumber = particle.arrow;
        this.damage = 25; // four hits to kill
        this.damagetype = damageType.physical;
        this.particleHit = particle.arrowHit;
        this.soundEffectName = 'shootArrow';
        break;
      }

    };
  });