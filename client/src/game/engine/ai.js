angular.module('game.engine.ai', [
  'game.engine.sfx',
  'game.entities.player',
  'game.gui.sprite',
  'game.engine.particleSystem.particles',
  'game.engine.spawn',
  'game.engine.level',
  'game.entities.enemy',
  'game.engine.timer',
  'game.gui.tile'
])

.factory('entityAI', function (sfx, player, sprite, particleSystem, spawner, level, walker, timer, tile) {

  var ai = {

    attackCastle: function attackCastle(nme) {
      $log.debug('Attacking the castle!');

      sfx.play('Goal');

      player.health--;
      sprite.updateGui(healthGui.instance, player.health);
      particleSystem.start(nme.x, nme.y, particle.goal);

      nme.active = false;
      // destroy this entity and its healthbar and team affiliation etc
      spawner.remove(nme);
      // fixme: maybe the door is an entity and we need to get its hp down?
      level.checkComplete();
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
        return;
      }

      // move the healthbar
      if (nme.healthbar_sprite) {
        nme.healthbar_sprite.moveTo(nme.x, nme.y + sprite.healthbar_offset);
        //nme.healthbar_sprite.setImage(sprite.healthbar_image[0]); // only change when damaged!
      }

      // entities can emit particleSystem.particles - nice for smoke trails
      if (nme.pendingParticles) {

        if (!nme.nextPartyTime) {
          nme.PartyDelay = 50;
          nme.PartyDelayExtraVariance = 0;
          nme.nextPartyTime = 1; // now!
        }

        if (nme.nextPartyTime <= timer.current_frame_timestamp) {
          nme.pendingParticles--;

          $log.debug('Entity time to Party');

          if (nme.pendingParticles > 0) {
            nme.nextPartyTime = timer.current_frame_timestamp + nme.PartyDelay + (Math.random() * nme.PartyDelayExtraVariance);
          }

          particleSystem.start(nme.x, nme.y + particleSystem.entity_particle_offset_y, nme.pendingParticleType);

          if (nme.pendingDamage) {
            $log.debug('entityAI has pending damage of ' + nme.pendingDamage);

            nme.health -= nme.pendingDamage;
            if (nme.healthbar_sprite) {
              if (nme.health > 75) {
                nme.healthbar_sprite.setImage(sprite.healthbar_image[0]);
              } else if (nme.health > 50) {
                nme.healthbar_sprite.setImage(sprite.healthbar_image[1]);
              } else if (nme.health > 25) {
                nme.healthbar_sprite.setImage(sprite.healthbar_image[2]);
              } else {
                nme.healthbar_sprite.setImage(sprite.healthbar_image[3]);
              }
            }

            if (nme.health <= 0) {
              $log.debug('Entity destroyed!');

              nme.active = false;
              nme.dead = true;
              nme.speed = 0;

              if (!walker.includeDeadBodies) {
                spawner.remove(nme);
              } else {
                // a little random death location
                nme.rotateTo(90 + (Math.random() * 10 - 5)); // lie down - simple!
                nme.x += Math.random() * 8 - 4;
                nme.y += Math.random() * 8 - 4;
                nme.alpha = 0.5; // slightly transparent

                // stop checking collisions
                sprite.teams[nme.team].remove(nme);
                
                // stop drawing its healthbar
                if (nme.healthbar_sprite) {
                  sprite.healthbar_sprites.remove(nme.healthbar_sprite);
                }
                  
                // check if we completed the level (eg all badguys destroyed?)
                level.checkComplete();
              }
            }
          }
        }
      }

      // shoot at entities if possible
      if (nme.weapon && nme.enemySpriteList) {

        if (!nme.weapon.nextShootTime) {
          nme.weapon.nextShootTime = timer.current_frame_timestamp + 
            (Math.random() * nme.weapon.shootDelay) + 
            (Math.random() * nme.weapon.shootDelayExtraVariance);
        }

        for (var tryme = 0; tryme < nme.enemySpriteList.length; tryme++) {
          var nextone = nme.enemySpriteList.at(tryme);

          if ((nextone != nme) && (nextone.team != nme.team) && nextone.active) {

            if (jaws.distanceBetween(nme, nextone) < nme.weapon.radius) {
              $log.debug('Able to shoot something!');

              // rotate to point at target even if not firing
              // only good for top down sprites (tank game turrets etc)
              // lookAt(nme, nextone.x, nextone.y);

              if (nme.weapon.nextShootTime < timer.current_frame_timestamp) {
                $log.debug('Entity time to shoot');

                nme.weapon.nextShootTime = timer.current_frame_timestamp + 
                  nme.weapon.shootDelay + 
                  (Math.random() * nme.weapon.shootDelayExtraVariance);

                //sfx.play('shootFire');
                sfx.play(nme.weapon.soundEffectName); 

                // left or right side?
                var tower_projectile_offsetX = 16;
                var tower_projectile_offsetY = -32; // spawn fireballs/arrows from window, not ground
                
                if (nme.x > nextone.x) {
                  tower_projectile_offsetX *= -1;
                }
                  
                // projectile moving particleSystem.particles
                particleSystem.start(
                  nme.x + tower_projectile_offsetX, 
                  nme.y + tower_projectile_offsetY, 
                  nme.weapon.projectilenumber, 
                  nextone.x, 
                  nextone.y
                );

                // we have perfect aim
                game.takeDamage(nextone, nme);
                break;
              }
            }
          }
        }
      }

      // do we need to move?
      if (nme.speed) {

        if (!nme.currentPath && !nme.waitingForPath) {
          $log.debug('Generating new path for an entity');

          nme.pathCurrentNode = 0;

          var currentGridX = (nme.x / tile.size) | 0;
          var currentGridY = (nme.y / tile.size) | 0;

          pathfinder.findPath(nme, currentGridX, currentGridY, pathfinder.goalX, pathfinder.goalY);

        } else if (nme.currentPath && !nme.waitingForPath) {
          //if (debugmode) log('Entity has a currentPath');

          if ((nme.pathCurrentNode < nme.currentPath.length - 1) && nme.currentPath[nme.pathCurrentNode + 1]) {
            nme.destinationX = nme.currentPath[nme.pathCurrentNode + 1].x * tile.size + tile.sizeDiv2;
            nme.destinationY = nme.currentPath[nme.pathCurrentNode + 1].y * tile.size + tile.sizeDiv2;

            // move toward our next waypoint
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
                  $log.debug('Death anim completed');
                }
              }
            }

            if (closeEnough(nme.destinationX, nme.destinationY, nme.x, nme.y, 5)) {
              nme.pathCurrentNode++;
              
              $log.debug('entityAI arrived at ' + nme.destinationX + ',' + nme.destinationY);
              $log.debug('entityAI next path node: ' + nme.pathCurrentNode);
            }

          } else {
            $log.debug('entityAI finished entire path!');
            nme.currentPath = null;
            // for this game, once we reach the destination we've completed our objective!
            ai.attackCastle(nme);
          }
        }
      }
    }
  };

  return ai;
});