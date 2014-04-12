angular.module('game.gui.tile', [
  'game.engine.pathfinder'
])

.factory('tile', function (pathfinder) {

  var tile = {
    size: 64, // skelevator 32, // pixel dimensions of the level spritesheet tiles
    sizeDiv2: (tile.size / 2) | 0, // |0 just forces integer type
    type: {
      // Enemy AI uses levelX.js data for pathfinder
      walkable: 1, // roads and other walkable paths
      blocked: 2, // places enemies cannot walk
      spawn: 3, // where the enemies come from
      goal: 4, // where the enemies run to
      buildable: 5, // able to put a tower here
      builtupon: 6, // towers

      // which tile numbers can entities walk on?
      walkables: [tile.type.walkable, tile.type.spawn, tile.type.goal, tile.type.buildable]
    },

    getType: function getType(tileX, tileY) {
      var tileStyle = 0;
      // which kind of tile did we click?
      if (pathfinder._grid && pathfinder._grid[tileY]) {
        tileStyle = pathfinder._grid[tileY][tileX];
      }
      $log.debug('tile.getType(' + tileX + ',' + tileY + ')=' + tileStyle);
      return tileStyle;
    },

    setType: function setType(tileX, tileY, setTo) {
      $log.debug('tile.setType(' + tileX + ',' + tileY + ') to ' + setTo);
      
      if (pathfinder._grid && pathfinder._grid[tileY]) {
        pathfinder._grid[tileY][tileX] = setTo;
      }
    },

    /**
     * Click a world tile - TileClick
     * Normally a build command - called from onPointerDown
     */
    click: function clickTile(tileX, tileY) {
      $log.debug('clickTile ' + tileX + ',' + tileY);

      if (timer.game_over) {
        return; 
      }

      var cameraMoveRequired = false;

      var tileStyleClicked = tile.getType(tileX, tileY);

      // game world pixel coords
      var px = tileX * tile.size + tile.sizeDiv2;
      var py = tileY * tile.size + tile.sizeDiv2;

      // debug only
      debugTouchInfo = '' + tileX + ',' + tileY + ':' + px + ',' + py + '=' + tileStyleClicked;

      // lazy init the sprites on demand - only happens the first time
      if (!buildMenu.sprite) {
        $log.debug('Creating buildMenu.sprite');

        // the ring of buttons GUI
        buildMenu.sprite = new jaws.Sprite({
          image : jaws.assets.get("buildmenu.png"),
          anchor : "center_center"
        });

        sprite.game_objects.push(buildMenu.sprite);
        
        // the overlay that obscures items we can't afford
        buildMenu.overlay1 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        });
        
        buildMenu.overlay2 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 
        
        buildMenu.overlay3 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 

        sprite.game_objects.push(buildMenu.overlay1);
        sprite.game_objects.push(buildMenu.overlay2);
        sprite.game_objects.push(buildMenu.overlay3);
        
        // the clickable buttons (a glowing yellow outline so we know we have enough money)
        buildMenu.button_highlight_image_on = sprite.chop(jaws.assets.get("gui.png"), 0, 320, 64, 64);
        buildMenu.button_highlight_image_off = sprite.chop(jaws.assets.get("gui.png"), 288, 320, 64, 64);
        buildMenu.button_highlight[0] = new jaws.Sprite({
          image : buildMenu.button_highlight_image_on,
          anchor : "center_bottom"
        });

        buildMenu.button_highlight[1] = new jaws.Sprite({
          image : buildMenu.button_highlight_image_on,
          anchor : "center_bottom"
        });

        buildMenu.button_highlight[2] = new jaws.Sprite({
          image : buildMenu.button_highlight_image_on,
          anchor : "center_bottom"
        });
        
        sprite.game_objects.push(buildMenu.button_highlight[0]);
        sprite.game_objects.push(buildMenu.button_highlight[1]);
        sprite.game_objects.push(buildMenu.button_highlight[2]);
      }

      if (!buildMenu.active) {

        // are we allowed to build here?
        if (tileStyleClicked != tile.type.buildable) {
          $log.debug('We cannot build on this style of tile.');
          buildMenu.off();
        } else {
          if (debugmode)
            log('Turning on the buildMenu');
          buildMenu.active = true;
          buildMenu.move(px, py);
          buildMenu.choice1_tileX = tileX;
          buildMenu.choice1_tileY = tileY - 1;
          buildMenu.choice2_tileX = tileX - 1;
          buildMenu.choice2_tileY = tileY;
          buildMenu.choice3_tileX = tileX + 1;
          buildMenu.choice3_tileY = tileY;
          buildMenu.pending_pixelX = px;
          buildMenu.pending_pixelY = py;
          buildMenu.pending_tileX = tileX;
          buildMenu.pending_tileY = tileY;
          sfx.play('openBuildMenu');
        }
        // don't do any building at this point!
        // we just made the menu visible - wait for another click.
        cameraMoveRequired = true;
      
      } else {
        settings.selectedBuildingStyle = settings.farAway;

        // fixme todo this should never be true?
        if (tile.getType(buildMenu.pending_tileX, buildMenu.pending_tileY) !== tile.type.buildable) {
          $log.debug('The pending build location already has a tower!');
        }

        if (tileX == buildMenu.choice1_tileX && tileY === buildMenu.choice1_tileY) {
          settings.selectedBuildingStyle = 0;
        }

        if (tileX == buildMenu.choice2_tileX && tileY === buildMenu.choice2_tileY) {
          settings.selectedBuildingStyle = 1;
        }
        
        if (tileX == buildMenu.choice3_tileX && tileY === buildMenu.choice3_tileY) {
          settings.selectedBuildingStyle = 2;
        }

        if (settings.selectedBuildingStyle === settings.farAway) {
          $log.debug('User cancelled build menu');
          buildMenu.off();
          cameraMoveRequired = true;

        } else {

          $log.debug('Requesting to build tower ' + settings.selectedBuildingStyle);

          // can we afford it?
          if (player.gold < settings.buildCost[settings.selectedBuildingStyle]) {
            $log.debug('We cannot afford to build this unit: we have ' + player.gold + ' gold but need ' + settings.buildCost[settings.selectedBuildingStyle]);
            sfx.play('NotEnoughMoney');

          } else {// we have enough money

            sfx.play('Build');
            particleSystem.start(buildMenu.pending_pixelX, buildMenu.pending_pixelY, particle.build);

            // spawn a new tower here
            var justBuilt = spawner.spawn(buildMenu.pending_pixelX, buildMenu.pending_pixelY, settings.selectedBuildingStyle + 1, team.good); // tower 1,2,3

            // pay up!
            player.gold -= settings.buildCost[settings.selectedBuildingStyle];

            // debug fixme todo lame - buildMenu!
            settings.selectedBuildingStyle++;
            if (settings.selectedBuildingStyle > 2) {
              settings.selectedBuildingStyle = 0;
            }

            sprite.updateGold();

            // don't let the entities move here anymore
            // fixme todo handle times when an entity is underneath a building! for PATHING (building on the road!)
            // not used but great for future pathing strategies by building on walkable tiles?
            pathfinder.astar.avoidAdditionalPoint(buildMenu.pending_tileX, buildMenu.pending_tileY);
            // if dynamic pathfinder, we will need to clear entity.path and redo the pathfinder_grid most likely todo fixme

            // so that we don't build multiple towers on the same spot
            tile.setType(buildMenu.pending_tileX, buildMenu.pending_tileY, tile.type.builtupon);

            // we successfully built something - done with menu!
            buildMenu.off();
          }
        } 
      } 

      // chase camera scroll if we just clicked the world and not the gui
      if (cameraMoveRequired) {
        camera.move(px, py);
      }
    }
  };

  return tile;
});