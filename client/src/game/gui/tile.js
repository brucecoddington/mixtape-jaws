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

    getType: function getTileType(tileX, tileY) {
      var tileStyle = 0;
      // which kind of tile did we click?
      if (pathfinder._grid && pathfinder._grid[tileY]) {
        tileStyle = pathfinder._grid[tileY][tileX];
      }
      $log.debug('getTileType(' + tileX + ',' + tileY + ')=' + tileStyle);
      return tileStyle;
    },

    setType: function setTileType(tileX, tileY, setTo) {
      $log.debug('setTileType(' + tileX + ',' + tileY + ') to ' + setTo);
      
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

      if (game_over) {
        return; 
      }

      var cameraMoveRequired = false;

      var tileStyleClicked = getTileType(tileX, tileY);

      // game world pixel coords
      var px = tileX * tile.size + tile.sizeDiv2;
      var py = tileY * tile.size + tile.sizeDiv2;

      // debug only
      debugTouchInfo = '' + tileX + ',' + tileY + ':' + px + ',' + py + '=' + tileStyleClicked;

      // lazy init the sprites on demand - only happens the first time
      if (!buildMenuSprite) {
        $log.debug('Creating buildMenuSprite');

        // the ring of buttons GUI
        buildMenuSprite = new jaws.Sprite({
          image : jaws.assets.get("buildmenu.png"),
          anchor : "center_center"
        });

        sprite.game_objects.push(buildMenuSprite);
        
        // the overlay that obscures items we can't afford
        buildMenuOverlay1 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        });
        
        buildMenuOverlay2 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 
        
        buildMenuOverlay3 = extractSprite(jaws.assets.get("gui.png"), 272, 464, 50, 50, {
          anchor : "center_bottom"
        }); 

        sprite.game_objects.push(buildMenuOverlay1);
        sprite.game_objects.push(buildMenuOverlay2);
        sprite.game_objects.push(buildMenuOverlay3);
        
        // the clickable buttons (a glowing yellow outline so we know we have enough money)
        buttonHighlightImageON = sprite.chop(jaws.assets.get("gui.png"), 0, 320, 64, 64);
        buttonHighlightImageOFF = sprite.chop(jaws.assets.get("gui.png"), 288, 320, 64, 64);
        buttonHighlight[0] = new jaws.Sprite({
          image : buttonHighlightImageON,
          anchor : "center_bottom"
        });

        buttonHighlight[1] = new jaws.Sprite({
          image : buttonHighlightImageON,
          anchor : "center_bottom"
        });

        buttonHighlight[2] = new jaws.Sprite({
          image : buttonHighlightImageON,
          anchor : "center_bottom"
        });
        
        sprite.game_objects.push(buttonHighlight[0]);
        sprite.game_objects.push(buttonHighlight[1]);
        sprite.game_objects.push(buttonHighlight[2]);
      }

      // fixme todo: the buildChoice1tileX etc is a hack: use guiSprites action and remember pending build xy

      if (!buildMenuActive) // we ARE allowed to build here and menu is off
      {
        // are we allowed to build here?
        if (tileStyleClicked != tile.type.buildable) {
          if (debugmode)
            log('We cannot build on this style of tile.');
          //sfx.play('NotEnoughMoney');
          // hide the menu
          buildMenuOFF();
        } else {
          if (debugmode)
            log('Turning on the buildMenu');
          buildMenuActive = true;
          buildMenuMove(px, py);
          buildChoice1tileX = tileX;
          buildChoice1tileY = tileY - 1;
          buildChoice2tileX = tileX - 1;
          buildChoice2tileY = tileY;
          buildChoice3tileX = tileX + 1;
          buildChoice3tileY = tileY;
          buildPendingPixelX = px;
          buildPendingPixelY = py;
          buildPendingTileX = tileX;
          buildPendingTileY = tileY;
          sfx.play('openBuildMenu');
        }
        // don't do any building at this point!
        // we just made the menu visible - wait for another click.
        cameraMoveRequired = true;
        //return;
      } else // buildMenuActive = true
      {
        settings.selectedBuildingStyle = settings.farAway;

        // fixme todo this should never be true?
        if (getTileType(buildPendingTileX, buildPendingTileY) != tile.type.buildable) {
          if (debugmode)
            log('The pending build location already has a tower!');
        }

        if (tileX == buildChoice1tileX && tileY == buildChoice1tileY) {
          settings.selectedBuildingStyle = 0;
        }
        if (tileX == buildChoice2tileX && tileY == buildChoice2tileY) {
          settings.selectedBuildingStyle = 1;
        }
        if (tileX == buildChoice3tileX && tileY == buildChoice3tileY) {
          settings.selectedBuildingStyle = 2;
        }

        if (settings.selectedBuildingStyle == settings.farAway) {
          if (debugmode)
            log('User cancelled build menu');
          buildMenuOFF();
          cameraMoveRequired = true; // click away means distracted - move there now!
          //return;
        } else // valid building selected
        {

          if (debugmode)
            log('Requesting to build tower ' + settings.selectedBuildingStyle);

          // can we afford it?
          if (player_Gold < settings.buildCost[settings.selectedBuildingStyle]) {
            if (debugmode)
              log('We cannot afford to build this unit: we have ' + player_Gold + ' gold but need ' + settings.buildCost[settings.selectedBuildingStyle]);
            // fixme todo play buzzer sound, flash gold, flash progress bars
            sfx.play('NotEnoughMoney');
            //return;
          } else // we have enough money
          {

            sfx.play('Build');

            particleSystem.start(buildPendingPixelX, buildPendingPixelY, particle.build);

            // spawn a new tower here
            var justBuilt = spawner.spawn(buildPendingPixelX, buildPendingPixelY, settings.selectedBuildingStyle + 1, team.good); // tower 1,2,3

            // pay up!
            player_Gold -= settings.buildCost[settings.selectedBuildingStyle];

            // debug fixme todo lame - buildMenu!
            settings.selectedBuildingStyle++;
            if (settings.selectedBuildingStyle > 2)
              settings.selectedBuildingStyle = 0;

            updateGoldGUI();

            // don't let the entities move here anymore
            // fixme todo handle times when an entity is underneath a building! for PATHING (building on the road!)
            // not used but great for future pathing strategies by building on walkable tiles?
            pathfinder.astar.avoidAdditionalPoint(buildPendingTileX, buildPendingTileY);
            // if dynamic pathfinder, we will need to clear entity.path and redo the pathfinder_grid most likely todo fixme

            // so that we don't build multiple towers on the same spot
            setTileType(buildPendingTileX, buildPendingTileY, tile.type.builtupon);

            // we successfully built something - done with menu!
            buildMenuOFF();
          } // if we have enough gold
        } // valid building button clicked
      } // build menu was visible

      // chase camera scroll if we just clicked the world and not the gui
      if (cameraMoveRequired)
        moveCamera(px, py);
    }
  };

  return tile;
});