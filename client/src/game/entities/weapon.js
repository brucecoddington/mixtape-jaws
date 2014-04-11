angular.module('game.entities.weapon', [])
  
  .value('weaponType', {
    // maps to particle animation number (5=arrows, 6=flame, 7=energy)
    ARROWS: 1,
    FIRE: 2,
    ENERGY: 3
  })

  .value('damageType', {
    PHYSICAL: 1,
    MAGICAL: 2,
    SLOW: 3
  })

  .factory('Weapon', function (weaponType, damageType) {
  
    return function GameWeapon(type) {
      this.self = this;
      this.damage = 25; // + or -: imagine healing towers?
      this.radius = 200; // attack range
      this.speed = 0; // + or -
      this.shootDelay = 3000; // time between shots
      this.shootDelayExtraVariance = 0;

      switch (type) {
      case weaponType.FIRE:
        this.projectilenumber = particleFIRE;
        this.damage = 40; // three hits to kill
        this.damagetype = damageType.MAGICAL;
        this.particleHit = particleFIREHIT;
        this.soundEffectName = 'shootFire';
        break;
      case weaponType.ENERGY:
        this.projectilenumber = particleENERGY;
        this.damage = 75; // two hits to kill
        this.damagetype = damageType.SLOW;
        this.particleHit = particleENERGYHIT;
        this.soundEffectName = 'hitEnergy';
        break;
      default: // case weaponType.ARROWS:
        this.projectilenumber = particleARROW;
        this.damage = 25; // four hits to kill
        this.damagetype = damageType.PHYSICAL;
        this.particleHit = particleARROWHIT;
        this.soundEffectName = 'shootArrow';
        break;
      }

    };
  });