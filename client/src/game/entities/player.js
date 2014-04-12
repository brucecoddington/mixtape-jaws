angular.module('game.entities.player', [])
  
.factory('player', function () {

  var player = {
    // current game player's stats
    gold_startwith: 40,
    gold: player.gold_startwith,
    next_gold_at: 0, // timestamp when we get another gold
    max_health: 15,
    health: 15
  };

  return player;
});

