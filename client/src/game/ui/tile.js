angular.module('game.ui.tile', [
  'game.data.ui.tile',
  'game.ui.build',
  'game.ui.gui',
  'game.ui.sprite',
  'game.engine.particles',
  'game.engine.pathfinder',
  'game.engine.timer',
  'game.engine.spawn',
  'game.engine.config'
])

.factory('tile', function ($log, pathfinder, timer, buildMenu, gui, sfx, player, settings, camera, sprite, tileData, particle, particleSystem, spawner, team) {

  var tile = {

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
    click: function click(tileX, tileY) {
      $log.debug('tile.click ' + tileX + ',' + tileY);

      if (timer.game_over) {
        return; 
      }

      var cameraMoveRequired = false;
      var tileStyleClicked = tile.getType(tileX, tileY);

      // game world pixel coords
      var px = tileX * tileData.size + tileData.sizeDiv2;
      var py = tileY * tileData.size + tileData.sizeDiv2;

      // debug only
      debugTouchInfo = '' + tileX + ',' + tileY + ':' + px + ',' + py + '=' + tileStyleClicked;

      // lazy init the sprites on demand - only happens the first time
      if (!buildMenu.sprite) {
        $log.debug('Creating buildMenu.sprite');

        // the ring of buttons GUI
        buildMenu.sprite = new jaws.Sprite({
          image : jaws.assets.get("map/buildmenu.png"),
          anchor : "center_center"
        });

        sprite.game_objects.push(buildMenu.sprite);
        
        // the overlay that obscures items we can't afford
        buildMenu.overlay1 = sprite.extract(jaws.assets.get("gui/gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        });
        
        buildMenu.overlay2 = sprite.extract(jaws.assets.get("gui/gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 
        
        buildMenu.overlay3 = sprite.extract(jaws.assets.get("gui/gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 

        sprite.game_objects.push(buildMenu.overlay1);
        sprite.game_objects.push(buildMenu.overlay2);
        sprite.game_objects.push(buildMenu.overlay3);
        
        // the clickable buttons (a glowing yellow outline so we know we have enough money)
        buildMenu.button_highlight_image_on = sprite.chop(jaws.assets.get("gui/gui.png"), 0, 320, 64, 64);
        buildMenu.button_highlight_image_off = sprite.chop(jaws.assets.get("gui/gui.png"), 288, 320, 64, 64);
        
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
        if (tileStyleClicked != tileData.type.buildable) {
          $log.debug('We cannot build on this style of tile.');
          buildMenu.off();
        } else {
          $log.debug('Turning on the buildMenu');
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
        settings.selected_building_style = settings.farAway;

        // fixme todo this should never be true?
        if (tile.getType(buildMenu.pending_tileX, buildMenu.pending_tileY) !== tileData.type.buildable) {
          $log.debug('The pending build location already has a tower!');
        }

        if (tileX == buildMenu.choice1_tileX && tileY === buildMenu.choice1_tileY) {
          settings.selected_building_style = 0;
        }

        if (tileX == buildMenu.choice2_tileX && tileY === buildMenu.choice2_tileY) {
          settings.selected_building_style = 1;
        }
        
        if (tileX == buildMenu.choice3_tileX && tileY === buildMenu.choice3_tileY) {
          settings.selected_building_style = 2;
        }

        if (settings.selected_building_style === settings.farAway) {
          $log.debug('User cancelled build menu');
          buildMenu.off();
          cameraMoveRequired = true;

        } else {

          $log.debug('Requesting to build tower ' + settings.selected_building_style);

          // can we afford it?
          if (player.gold < settings.build_cost[settings.selected_building_style]) {
            $log.debug('We cannot afford to build this unit: we have ' + player.gold + ' gold but need ' + settings.build_cost[settings.selected_building_style]);
            sfx.play('NotEnoughMoney');

          } else {// we have enough money

            sfx.play('Build');
            particleSystem.start(buildMenu.pending_pixelX, buildMenu.pending_pixelY, particle.build);

            // spawn a new tower here
            var justBuilt = spawner.spawn(buildMenu.pending_pixelX, buildMenu.pending_pixelY, settings.selected_building_style + 1, team.good); // tower 1,2,3

            // pay up!
            player.gold -= settings.build_cost[settings.selected_building_style];

            // debug fixme todo lame - buildMenu!
            settings.selected_building_style++;
            if (settings.selected_building_style > 2) {
              settings.selected_building_style = 0;
            }

            gui.updateGold();

            // don't let the entities move here anymore
            // fixme todo handle times when an entity is underneath a building! for PATHING (building on the road!)
            // not used but great for future pathing strategies by building on walkable tiles?
            pathfinder.astar.avoidAdditionalPoint(buildMenu.pending_tileX, buildMenu.pending_tileY);
            // if dynamic pathfinder, we will need to clear entity.path and redo the pathfinder_grid most likely todo fixme

            // so that we don't build multiple towers on the same spot
            tile.setType(buildMenu.pending_tileX, buildMenu.pending_tileY, tileData.type.builtupon);

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