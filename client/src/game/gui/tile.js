angular.module('game.gui.tile', [])

  .factory('tile', function () {

    return {
      getType: function getTileType(tileX, tileY) {
        var tileStyle = 0;
        // which kind of tile did we click?
        if (AI && AI._grid && AI._grid[tileY]) {
          tileStyle = AI._grid[tileY][tileX];
        }
        if (debugmode)
          log('getTileType(' + tileX + ',' + tileY + ')=' + tileStyle);
        return tileStyle;
      },

      setType: function setTileType(tileX, tileY, setTo) {
        if (debugmode)
          log('setTileType(' + tileX + ',' + tileY + ') to ' + setTo);
        if (AI && AI._grid && AI._grid[tileY]) {
          AI._grid[tileY][tileX] = setTo;
        }
      },

      /**
       * Click a world tile - TileClick
       * Normally a build command - called from onPointerDown
       */
      click: function clickTile(tileX, tileY) {
        if (debugmode)
          log('clickTile ' + tileX + ',' + tileY);

        if (game_over)
          return;

        var cameraMoveRequired = false;

        /*
        // if we're in the cinematic, exit now and ignore click
        if (introSceneNumber < 99) {
        if (debugmode) log('Skipping intro cinematic');
        introSceneNumber = 99;
        introCinematic();
        return;
        }
         */

        var tileStyleClicked = getTileType(tileX, tileY);

        // game world pixel coords
        var px = tileX * TILESIZE + TILESIZEDIV2;
        var py = tileY * TILESIZE + TILESIZEDIV2;

        // debug only
        debugTouchInfo = '' + tileX + ',' + tileY + ':' + px + ',' + py + '=' + tileStyleClicked;

        // lazy init the sprites on demand - only happens the first time
        if (!buildMenuSprite) {
          if (debugmode)
            log('Creating buildMenuSprite');
          // the ring of buttons GUI
          buildMenuSprite = new jaws.Sprite({
              image : jaws.assets.get("buildmenu.png"),
              anchor : "center_center"
            });
          game_objects.push(buildMenuSprite);
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
          game_objects.push(buildMenuOverlay1);
          game_objects.push(buildMenuOverlay2);
          game_objects.push(buildMenuOverlay3);
          // the clickable buttons (a glowing yellow outline so we know we have enough money)
          buttonHighlightImageON = chopImage(jaws.assets.get("gui.png"), 0, 320, 64, 64);
          buttonHighlightImageOFF = chopImage(jaws.assets.get("gui.png"), 288, 320, 64, 64);
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
          game_objects.push(buttonHighlight[0]);
          game_objects.push(buttonHighlight[1]);
          game_objects.push(buttonHighlight[2]);
        }

        // fixme todo: the buildChoice1tileX etc is a hack: use guiSprites action and remember pending build xy

        if (!buildMenuActive) // we ARE allowed to build here and menu is off
        {
          // are we allowed to build here?
          if (tileStyleClicked != TILE_INDEX_BUILDABLE) {
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
          selectedBuildingStyle = FAR_AWAY;

          // fixme todo this should never be true?
          if (getTileType(buildPendingTileX, buildPendingTileY) != TILE_INDEX_BUILDABLE) {
            if (debugmode)
              log('The pending build location already has a tower!');
          }

          if (tileX == buildChoice1tileX && tileY == buildChoice1tileY) {
            selectedBuildingStyle = 0;
          }
          if (tileX == buildChoice2tileX && tileY == buildChoice2tileY) {
            selectedBuildingStyle = 1;
          }
          if (tileX == buildChoice3tileX && tileY == buildChoice3tileY) {
            selectedBuildingStyle = 2;
          }

          if (selectedBuildingStyle == FAR_AWAY) {
            if (debugmode)
              log('User cancelled build menu');
            buildMenuOFF();
            cameraMoveRequired = true; // click away means distracted - move there now!
            //return;
          } else // valid building selected
          {

            if (debugmode)
              log('Requesting to build tower ' + selectedBuildingStyle);

            // can we afford it?
            if (player_Gold < buildCost[selectedBuildingStyle]) {
              if (debugmode)
                log('We cannot afford to build this unit: we have ' + player_Gold + ' gold but need ' + buildCost[selectedBuildingStyle]);
              // fixme todo play buzzer sound, flash gold, flash progress bars
              sfx.play('NotEnoughMoney');
              //return;
            } else // we have enough money
            {

              sfx.play('Build');

              startParticleSystem(buildPendingPixelX, buildPendingPixelY, particleBUILD);

              // spawn a new tower here
              var justBuilt = spawnEntity(buildPendingPixelX, buildPendingPixelY, selectedBuildingStyle + 1, TEAM_GOOD); // tower 1,2,3

              // pay up!
              player_Gold -= buildCost[selectedBuildingStyle];

              // debug fixme todo lame - buildMenu!
              selectedBuildingStyle++;
              if (selectedBuildingStyle > 2)
                selectedBuildingStyle = 0;

              updateGoldGUI();

              // don't let the entities move here anymore
              // fixme todo handle times when an entity is underneath a building! for PATHING (building on the road!)
              // not used but great for future pathing strategies by building on walkable tiles?
              AI.astar.avoidAdditionalPoint(buildPendingTileX, buildPendingTileY);
              // if dynamic pathfinding, we will need to clear entity.path and redo the AI._grid most likely todo fixme

              // so that we don't build multiple towers on the same spot
              setTileType(buildPendingTileX, buildPendingTileY, TILE_INDEX_BUILTUPON);

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
  });