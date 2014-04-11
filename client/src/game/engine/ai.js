angular.module('game.engine.ai', [])

  .value('ai', {
    // one instance of the Pathfinding() class, set up with current level
    AI: null,
    TEAM_BAD: 0,
    TEAM_GOOD: 1
  })

  .factory('enemyTiles', function () {

    var tiles = {
      // Enemy AI uses levelX.js data for pathfinding
      WALKABLE: 1, // roads and other walkable paths
      BLOCKED: 2, // places enemies cannot walk
      SPAWN: 3, // where the enemies come from
      GOAL: 4, // where the enemies run to
      BUILDABLE: 5, // able to put a tower here
      BUILTUPON: 6, // towers

      // which tile numbers can entities walk on?
      WALKABLES: [tiles.WALKABLE, tiles.SPAWN, tiles.GOAL, tiles.BUILDABLE]
    };

    return tiles;
  })

  .factory('entityAI', function (sfx) {

    return {

      attackCastle: function attackCastle(nme) {
        $log.debug('Attacking the castle!');

        sfx.play('Goal');
        player_Health--;
        updateGUIsprites(HealthGUI, player_Health);
        startParticleSystem(nme.x, nme.y, particleGOAL);
        nme.active = false;
        // destroy this entity and its healthbar and team affiliation etc
        removeEntity(nme);
        // fixme: maybe the door is an entity and we need to get its hp down?
        checkLevelComplete();
      },

      closeEnough: function closeEnough(x1, y1, x2, y2, dist) {
        return (Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= dist);
      },

      /**
       * Very simplistic entity AI update function
       * called every frame to move entities
       */
      update: function entityAI(nme) {

        if (!nme.active) {
          //$log.debug("entityAI ignoring inactive entity");
          return;
        }

        //$log.debug("entityAI for an entity with speed " + nme.speed);

        // move the healthbar
        if (nme.healthbarsprite) {
          nme.healthbarsprite.moveTo(nme.x, nme.y + HEALTHBAROFFSET);
          //nme.healthbarsprite.setImage(healthbarImage[0]); // only change when damaged!
        }

        // entities can emit particles - nice for smoke trails
        if (nme.pendingParticles) {
          if (!nme.nextPartyTime)
          {
            nme.PartyDelay = 50;
            nme.PartyDelayExtraVariance = 0;
            nme.nextPartyTime = 1; // now!
          }
          if (nme.nextPartyTime <= currentFrameTimestamp) {
            nme.pendingParticles--;
            if (debugmode > 2)
              log('Entity time to Party');

            if (nme.pendingParticles > 0)
              nme.nextPartyTime = currentFrameTimestamp + nme.PartyDelay + (Math.random() * nme.PartyDelayExtraVariance);

            startParticleSystem(nme.x, nme.y + ENTITY_PARTICLE_OFFSETY, nme.pendingParticleType);

            if (nme.pendingDamage) {
              if (debugmode)
                log('entityAI has pending damage of ' + nme.pendingDamage);

              nme.health -= nme.pendingDamage;
              if (nme.healthbarsprite) {
                if (nme.health > 75)
                  nme.healthbarsprite.setImage(healthbarImage[0]);
                else if (nme.health > 50)
                  nme.healthbarsprite.setImage(healthbarImage[1]);
                else if (nme.health > 25)
                  nme.healthbarsprite.setImage(healthbarImage[2]);
                else
                  nme.healthbarsprite.setImage(healthbarImage[3]);
              }

              if (nme.health <= 0) {
                if (debugmode)
                  log('Entity destroyed!');
                nme.active = false;
                nme.dead = true;
                nme.speed = 0;
                if (!includeDeadBodies) {
                  removeEntity(nme);
                } else {
                  // a little random death location
                  nme.rotateTo(90 + (Math.random() * 10 - 5)); // lie down - simple!
                  nme.x += Math.random() * 8 - 4;
                  nme.y += Math.random() * 8 - 4;
                  nme.alpha = 0.5; // slightly transparent
                  // stop checking collisions
                  teams[nme.team].remove(nme);
                  // stop drawing its healthbar
                  if (nme.healthbarsprite)
                    healthbarsprites.remove(nme.healthbarsprite);
                  // check if we completed the level (eg all badguys destroyed?) fixme todo: maybe just current ones: waves
                  checkLevelComplete();
                } // if includeDeadBodies
              } //  if it died
            } // if pending damage
          } // time for the pending particle
        } // if pendingParticles

        // shoot at entities if possible
        if (nme.weapon && nme.enemySpriteList) {
          if (!nme.weapon.nextShootTime) // init shooting ai fixme constructor tons of stuff here
          {
            nme.weapon.nextShootTime = currentFrameTimestamp + (Math.random() * nme.weapon.shootDelay) + (Math.random() * nme.weapon.shootDelayExtraVariance);
          }

          for (var tryme = 0; tryme < nme.enemySpriteList.length; tryme++) {
            var nextone = nme.enemySpriteList.at(tryme);
            if ((nextone != nme) && (nextone.team != nme.team) && nextone.active) {
              // fixme maybe choose the CLOSEST viable target? or oldest?
              if (jaws.distanceBetween(nme, nextone) < nme.weapon.radius) {

                if (debugmode > 2)
                  log('Able to shoot something!');

                // rotate to point at target even if not firing
                // only good for top down sprites (tank game turrets etc)
                // lookAt(nme, nextone.x, nextone.y);

                if (nme.weapon.nextShootTime < currentFrameTimestamp) {
                  if (debugmode)
                    log('Entity time to shoot');
                  nme.weapon.nextShootTime = currentFrameTimestamp + nme.weapon.shootDelay + (Math.random() * nme.weapon.shootDelayExtraVariance);

                  //sfx.play('shootFire');
                  sfx.play(nme.weapon.soundEffectName); // poopoo

                  // left or right side?
                  var tower_projectile_offsetX = 16;
                  if (nme.x > nextone.x)
                    tower_projectile_offsetX *= -1;

                  // projectile moving particles
                  startParticleSystem(nme.x + tower_projectile_offsetX, nme.y + tower_projectile_offsetY, nme.weapon.projectilenumber, nextone.x, nextone.y);

                  // we have perfect aim
                  takeDamage(nextone, nme);

                  break; // out of loop: only attack once
                } // time
              } // distance
            } // team
          } // loop
          //} // time
        } // if nme.weapon


        // do we need to move?
        if (nme.speed) {
          if (!nme.currentPath && !nme.waitingForPath) {
            if (debugmode)
              log('Generating new path for an entity');
            nme.pathCurrentNode = 0;

            var currentGridX = (nme.x / TILESIZE) | 0;
            var currentGridY = (nme.y / TILESIZE) | 0;
            AI.findPath(nme, currentGridX, currentGridY, AI.goalX, AI.goalY);

          } else if (nme.currentPath && !nme.waitingForPath) {
            //if (debugmode) log('Entity has a currentPath');

            if ((nme.pathCurrentNode < nme.currentPath.length - 1) && nme.currentPath[nme.pathCurrentNode + 1]) {
              nme.destinationX = nme.currentPath[nme.pathCurrentNode + 1].x * TILESIZE + TILESIZEDIV2; // + wobbleAI();
              nme.destinationY = nme.currentPath[nme.pathCurrentNode + 1].y * TILESIZE + TILESIZEDIV2; // + wobbleAI();

              // move towards our next waypoint
              // and switch animations accordingly
              if (nme.destinationY > nme.y) {
                nme.y += nme.speed;
                nme.currentAnimation = nme.move_s;
              }
              if (nme.destinationY < nme.y) {
                nme.y -= nme.speed;
                nme.currentAnimation = nme.move_n;
              }
              if (nme.destinationX > nme.x) {
                nme.x += nme.speed;
                nme.currentAnimation = nme.move_e;
              }
              if (nme.destinationX < nme.x) {
                nme.x -= nme.speed;
                nme.currentAnimation = nme.move_w;
              }

              // rotate nicely - good for racing games or pure top view
              // lookAt(nme, nme.destinationX, nme.destinationY);

              // only animate if moving
              // animate using the spritesheet - if specified: might be a static sprite (tower)
              if (nme.currentAnimation) {
                nme.setImage(nme.currentAnimation.next());
                if (nme.currentAnimation.atLastFrame()) {
                  if (nme.dying) { // todo fixme - unimplemented - need anim art
                    nme.active = false;
                    nme.dying = false;
                    nme.dead = true;
                    //nme.currentAnimation = nme.deathanim;
                    //anentity.setImage(anentity.move_n.frames[0]);
                    if (debugmode)
                      log('Death anim completed');
                  }
                }
              }

              if (closeEnough(nme.destinationX, nme.destinationY, nme.x, nme.y, 5)) {
                nme.pathCurrentNode++;
                if (debugmode > 2)
                  log('entityAI arrived at ' + nme.destinationX + ',' + nme.destinationY);
                if (debugmode > 2)
                  log('entityAI next path node: ' + nme.pathCurrentNode);
              }
            } else {
              if (debugmode)
                log('entityAI finished entire path!');
              nme.currentPath = null;
              // for this game, once we reach the destination we've completed our objective!
              attackCastle(nme);
            }

          }
        } // movement
      }
 
    };
  });