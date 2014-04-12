angular.module('game.engine.pathfinder', [
  'game.engine.profiler',
  'game.gui.tile'
])

.factory('pathfinder', function ($log, profiler, tile) {
  $log.debug('init pathfinder');
  profiler.start('init pathfinder');

  function pathFoundCallback(who, path) {
    $log.debug('pathFoundCallback');

    if (path === null) {
      $log.debug('Unable to find path!');
    } else {
      $log.debug('We found a path!');

      var pathstring = '';
      for (var pathloop = 0; pathloop < path.length; pathloop++) {
        pathstring += path[pathloop].x + ',' + path[pathloop].y + '|';
      }
      
      $log.debug(pathstring);

      if (who) {
        who.currentPath = path;
        who.waitingForPath = false;
      }
    }
  }

  var astar = new window.EasyStar.js();
  astar.enableDiagonals();

  var pathfinder = {
    astar: astar,
    spawnX: 0,
    spawnY: 0,
    goalX: 1,
    goalY: 1,

    /**
     * A simple utility function that splits a 1d array [1,2,3,4,5,6,7,8]
     * into a 2d array of a defined column count [[1,2,3,4],[5,6,7,8]]
     */
    listToMatrix: function listToMatrix(list, elementsPerSubArray) {
      var matrix = [],
      i,
      k,
      currentCol;

      for (i = 0, k = -1; i < list.length; i++) {
        if (i % elementsPerSubArray === 0) {
          k++;
          matrix[k] = [];
          currentCol = 0;
        }

        // detect start and end locations
        if (list[i] == tile.type.spawn) {
          pathfinder.spawnX = currentCol; // in pixels: * tile.size + tile.sizeDiv2;
          pathfinder.spawnY = k; // in pixels: * tile.size + tile.sizeDiv2;
          
          $log.debug('Found the SPAWN at ' + pathfinder.spawnX + ',' + pathfinder.spawnY);
        }

        if (list[i] == tile.type.goal) {
          pathfinder.goalX = currentCol; // in pixels: * tile.size + tile.sizeDiv2;
          pathfinder.goalY = k; //in pixels: * tile.size + tile.sizeDiv2;

          $log.debug('Found the GOAL at ' + pathfinder.goalX + ',' + pathfinder.goalY);
        }

        currentCol++;

        matrix[k].push(list[i]);
      }

      return matrix;
    },

    newGrid: function newGrid(lvldata, lvlw, lvlh) {
      $log.debug('pathfinder.newGrid is ' + lvlw + 'x' + lvlh);

      pathfinder._grid = pathfinder.listToMatrix(lvldata, lvlw); // turn the 1d array into a 2d array
      pathfinder.astar.setGrid(pathfinder._grid); //Tell EasyStar that pathfinder is the grid we want to use
      pathfinder.astar.setAcceptableTiles(tile.type.walkables); //Set acceptable tiles - an array of tile numbers we're allowed to walk on
    },

    findPath: function findPath(who, x1, y1, x2, y2) {
      $log.debug('Requesting a path from ' + x1 + ',' + y1 + ' to ' + x2 + ',' + y2);
      
      if (!pathfinder._grid) {
        $log.debug('ERROR: Unable to findPath: newGrid has net yet been called!');

        pathFoundCallback(who, null);
        return;
      }

      who.waitingForPath = true;
      
      pathfinder.astar.findPath(x1, y1, x2, y2, function (path) {
        pathFoundCallback(who, path);
      });
    },

    /**
     * Tell EasyStar to calculate a little, right now!
     */
    update: function update() {
      profiler.start('pathfinder.update');
      pathfinder.astar.calculate();
      profiler.end('pathfinder.update');
    }
  };

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


    /*
    // test pathfinder!
    // the callback is inline so we know which AI it is for
    profiler.start('test pathfinder');
    var testAI = {};
    this.astar.findPath(0, 0, 9, 9,
    function (path) { pathFoundCallback(testAI, path); }
    );
    //Tell EasyStar to calculate a little, right now!
    this.astar.calculate();
     */

  profiler.end('init pathfinder');
  return pathfinder;
});