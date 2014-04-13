angular.module('game.states.intro', [
  'game.entities.enemy',
  'game.engine.sfx',
  'game.engine.timer',
  'game.ui.sprite'
])

.factory('intro', function ($log, $timeout, enemyWave, sfx, sound, timer, sprite) {

  var intro = {

    // the intro NPC dialogue cinematic
    cinematic_sprites: [],
    current_cinematic_sprite: null,
    use_cinematic_bg: false,
    cinematic_bg: null,
    scene_number: 0,
    sound_has_been_played: false,
    sound1: null,
    cinematic_scene_length_ms: [2500, 5000],
    cinematic_scenecount: 2,

    // callbacks from the intro NPC dialogue voiceover sounds
    started: function started() {
      $log.debug('intro started');
    },

    loaded: function loaded() {
      $log.debug('intro loaded');
    },

    loadError: function loadError() {
      $log.debug('intro load error');
    },

    nextScene: function nextScene() {
      $log.debug('intro next scene');
      intro.cinematic();
    },

    cinematic: function cinematic() {
      intro.scene_number++;

      if (intro.scene_number > intro.cinematic_scenecount) {
        intro.scene_number = 999;
        intro.current_cinematic_sprite = null;
        intro.cinematic_bg = null;

        $log.debug('introCinamatic is over: starting waves!');
        
        enemyWave.next_spawntime = timer.current_frame_timestamp - 1; // NOW!
        return;
      }

      $log.debug('intro.cinematic ' + intro.scene_number);

      if (!sound.mute) {
        if (!intro.sound_has_been_played) {
          $log.debug('Playing the intro voiceover sound.');

          var soundSettings = {
            volume : 1.0, // 0 to 1
            buffer : false, // if true, stream using HTML5Audio - if false: wait for full download
            onplay : intro.started,
            onload : intro.loaded,
            onloaderror : intro.loadError,
            onend : intro.nextScene
          };

          soundSettings.urls = ['assets/audio/bgm/intro.mp3', 'assets/audio/bgm/intro.ogg', 'assets/audio/bgm/intro.wav'];
          
          intro.sound1 = new Howl(soundSettings).play();

          // wp8 sound hack: FIXME TODO
          sfx.play('intro');

          intro.sound_has_been_played = true;
        }
      }

      $timeout(intro.cinematic, intro.cinematic_scene_length_ms[intro.scene_number - 1]);

      // a background always looks cool
      if (!intro.cinematic_bg && intro.use_cinematic_bg) {
        intro.cinematic_bg = new jaws.Sprite({
          image : jaws.assets.get("map/map.png"),
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2) | 0,
          anchor : "center_center"
        });
      }

      // do we need to init the sprite?
      if (!intro.cinematic_sprites[intro.scene_number]) {

        var spriteParams = {
          x : (jaws.width / 2) | 0,
          y : (jaws.height - 64) | 0,
          anchor : "center_bottom"
        };

        intro.cinematic_sprites[intro.scene_number] = sprite.extract(jaws.assets.get("map/cinematic.png"), 0, 80 * (intro.scene_number - 1), 576, 80, spriteParams);
      }

      // don't let the previous one accept clicks
      if (intro.current_cinematic_sprite) {
        intro.current_cinematic_sprite.action = null;
      }
        
      intro.current_cinematic_sprite = intro.cinematic_sprites[intro.scene_number];
      // we now want to trap clicks on this sprite
      intro.current_cinematic_sprite.action = intro.skip;

    },

    skip: function introCinematicSkip() {
      $log.debug('Skipping intro cinematic due to clicking a sprite in button_sprites that has an action()');
      intro.scene_number = 999;
      intro.cinematic();
    }

  };

  return intro;
});