angular.module('game.engine.pathfinding', [])

  .factory('Pathfinding', function () {
    
    function pathFoundCallback(who, path) {
      if (debugmode)
        log('pathFoundCallback');
      if (path === null) {
        if (debugmode)
          log('Unable to find path!');
      } else {
        if (debugmode)
          log('We found a path!');
        var pathstring = '';
        for (var pathloop = 0; pathloop < path.length; pathloop++) {
          pathstring += path[pathloop].x + ',' + path[pathloop].y + '|';
        }
        if (debugmode)
          log(pathstring);

        if (who) {
          who.currentPath = path;
          who.waitingForPath = false;
        }

      }

    /**
     * The pathfinding class constructor
     */
    return function Pathfinding() {
      if (debugmode)
        log('init Pathfinding');
      profile_start('init Pathfinding');

      this.astar = new window.EasyStar.js();
      this.astar.enableDiagonals();

      /*
      // default 10x10 world grid data for testing only
      // a simple circuit around the outside
      this._grid =
      [
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
      ];

      this.astar.setGrid(this._grid); //Tell EasyStar that this is the grid we want to use
      this.astar.setAcceptableTiles([0]); //Set acceptable tiles - an array of tile numbers we're allowed to walk on
      //this.astar.setIterationsPerCalculation(300); //Set iterations per calculation - some paths may take > 1 frame to calculate!
      //this.astar.setTileCost(1, 1.1); //Make it slightly preferable to take roads - tilenum, costmultiplier
       */

      /**
       * A simple utility function that splits a 1d array [1,2,3,4,5,6,7,8]
       * into a 2d array of a defined column count [[1,2,3,4],[5,6,7,8]]
       */
      this.listToMatrix = function (list, elementsPerSubArray) {
        var matrix = [],
        i,
        k,
        currentCol;

        for (i = 0, k = -1; i < list.length; i++) {
          if (i % elementsPerSubArray == 0) {
            k++;
            matrix[k] = [];
            currentCol = 0;
          }

          // detect start and end locations
          if (list[i] == TILE_INDEX_SPAWN) {
            this.spawnX = currentCol; // in pixels: * TILESIZE + TILESIZEDIV2;
            this.spawnY = k; // in pixels: * TILESIZE + TILESIZEDIV2;
            if (debugmode)
              log('Found the SPAWN at ' + this.spawnX + ',' + this.spawnY);
          }
          if (list[i] == TILE_INDEX_GOAL) {
            this.goalX = currentCol; // in pixels: * TILESIZE + TILESIZEDIV2;
            this.goalY = k; //in pixels: * TILESIZE + TILESIZEDIV2;
            if (debugmode)
              log('Found the GOAL at ' + this.goalX + ',' + this.goalY);
          }

          currentCol++;

          matrix[k].push(list[i]);
        }

        return matrix;
      };

      this.spawnX = 0;
      this.spawnY = 0;
      this.goalX = 1;
      this.goalY = 1;

      this.newGrid = function (lvldata, lvlw, lvlh) {
        if (debugmode)
          log('pathfinding.newGrid is ' + lvlw + 'x' + lvlh);

        this._grid = this.listToMatrix(lvldata, lvlw); // turn the 1d array into a 2d array
        this.astar.setGrid(this._grid); //Tell EasyStar that this is the grid we want to use
        this.astar.setAcceptableTiles(TILE_INDEX_WALKABLES); //Set acceptable tiles - an array of tile numbers we're allowed to walk on
        // wp8 need to JSON.stringify
        // if (debugmode) log(this._grid);
      };

      /*
      // test pathfinding!
      // the callback is inline so we know which AI it is for
      profile_start('test Pathfinding');
      var testAI = {};
      this.astar.findPath(0, 0, 9, 9,
      function (path) { pathFoundCallback(testAI, path); }
      );
      //Tell EasyStar to calculate a little, right now!
      this.astar.calculate();
       */

      this.findPath = function (who, x1, y1, x2, y2) {
        if (debugmode > 1)
          log('Requesting a path from ' + x1 + ',' + y1 + ' to ' + x2 + ',' + y2);
        if (!this._grid) {
          if (debugmode)
            log('ERROR: Unable to findPath: newGrid has net yet been called!');
          pathFoundCallback(who, null);
          return;
        }
        who.waitingForPath = true;
        this.astar.findPath(x1, y1, x2, y2,
          function (path) {
          pathFoundCallback(who, path);
        });
      };

      /**
       * Tell EasyStar to calculate a little, right now!
       */
      this.update = function () {
        profile_start('Pathfinding.update');
        //if (debugmode>1) log('Pathfinding.update');
        this.astar.calculate();
        profile_end('Pathfinding.update');
      };

      profile_end('init Pathfinding');
    };

  });