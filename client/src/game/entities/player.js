angular.module('game.entities.player', [])
  .value('playerStats', {
    // current game player's stats
    player_gold_startwith: 40,
    player_Gold: player_gold_startwith,
    player_nextGoldAt: 0, // timestamp when we get another gold
    player_maxHealth: 15,
    player_Health: 15
  })

  .factory('Player', function () {

    return function GamePlayer() {
      this.self = this;
      this.name = '';
      this.score = 0;
      this.frame = 0;
      this.startTime = 0;
      this.money = 0; // how much gold we currently have
      this.moneyRate = 1; // how much gold we earn each sim
      this.entities = []; // a SpriteList containing active (alive) entities
      this.towers = []; // a SpriteList containing all the user's defenses
      this.bullets = []; // a SpriteList containing active bullets
      this.bases = []; // a SpriteList containing usually just one "base"
      this.waves = []; // a string containing pending badguy spawns
      this.spells = []; // an array of clickable area-of-effect special moves
    };
  });

