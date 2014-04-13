angular.module('game.data.ui.tile', [])

.factory('tileData', function () {

  var tileSize = 64;

  var data = {
    type: {
      // Enemy AI uses levelX.js data for pathfinder
      walkable: 1, // roads and other walkable paths
      blocked: 2, // places enemies cannot walk
      spawn: 3, // where the enemies come from
      goal: 4, // where the enemies run to
      buildable: 5, // able to put a tower here
      builtupon: 6 // towers
    },

    size: tileSize, // skelevator 32, // pixel dimensions of the level spritesheet tiles
    sizeDiv2: (tileSize / 2) | 0 // |0 just forces integer type
  };
  
  // which tile numbers can entities walk on?
  data.type.walkables = [data.type.walkable, data.type.spawn, data.type.goal, data.type.buildable];
  
  return data;
});