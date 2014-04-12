angular.module('game.entities.player', [])
  
  .factory('player', function () {

    var player = {
      // current game player's stats
      gold_startwith: 40,
      gold: player.gold_startwith,
      nextGoldAt: 0, // timestamp when we get another gold
      maxHealth: 15,
      health: 15,
      self: this,
      name: '',
      score: 0,
      frame: 0,
      startTime: 0,
      money: 0, // how much gold we currently have
      moneyRate: 1, // how much gold we earn each sim
      entities: [], // a SpriteList containing active (alive) entities
      towers: [], // a SpriteList containing all the user's defenses
      bullets: [], // a SpriteList containing active bullets
      bases: [], // a SpriteList containing usually just one "base"
      waves: [], // a string containing pending badguy spawns
      spells: [] // an array of clickable area-of-effect special moves
    };

    return player;
  });

