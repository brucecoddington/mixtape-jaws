angular.module('game.engine.sfx', [])
  
  .value('soundConfig', { 
    // sound
    mute: false, // no sound at all if true
    soundMusic: null // the background music loop
  })

  .factory('sound', function () {

    return {
      /**
       * Inits the sound engine by preloading the appropriate sound data
       * ogg and wav versions are only used for online webpage versions
       * in order to account for varying codec availability between browsers
       * in win8 store apps, only the mp3 is loaded
       * NOTE: this has no effect when using wp8 which uses C++ XSound code
       */
      init: function soundInit() {
        if (debugmode)
          log('soundInit...');
        profile_start('soundInit');
        // start the ambient music immediately - while downloading sprites
        soundMusic = new Howl({
            urls : ['game-media/music.mp3', 'game-media/music.ogg', 'game-media/music.wav'],
            // this should be true but it never loops if we stream
            buffer : false, // stream - start playing before all is downloaded: forces use of html5audio
            autoplay : true,
            loop : true,
            volume : 0.25 // quieter
          });

        // wp8 only sound hack: FIXME TODO
        sfx.play('music');

        profile_end('soundInit');
      }
    };
  })

  .factory('sfx', function () {
    
    // sounds the game needs
    var sfx = new Howl({
      urls : ['assets/audio/sfx/sfx.mp3', 'assets/audio/sfx/sfx.ogg'],
      volume : 0.5,
      sprite : {
        // ms offset, ms length
        spawn : [0, 241],
        shootArrow : [300, 548],
        shootFire : [900, 879],
        hitEnergy : [1800, 1718],
        openBuildMenu : [3600, 440],
        Build : [4100, 1758],
        Goal : [5900, 1277],
        Victory : [7200, 1758],
        Defeat : [7200, 1758], // reuse Victory
        NotEnoughMoney : [9000, 560],
        menuclick : [3600, 440], // reuse openBuildMenu
        mapclick : [5900, 1277] // reuse Goal
      }
    });

    return sfx;
  });