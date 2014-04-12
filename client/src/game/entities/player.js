angular.module('game.entities.player', [])
  
.factory('player', function () {

  var player = {
    // current game player's stats
    gold_startwith: 40,
    gold: player.gold_startwith,
    nextGoldAt: 0, // timestamp when we get another gold
    maxHealth: 15,
    health: 15
  };

  return player;
});

