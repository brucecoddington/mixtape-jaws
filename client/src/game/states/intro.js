angular.module('game.states.intro', [])
  
  .factory('intro', function () {

    /**
     * A simple NPC dialogue cinematic
     * plays MP3 files and switches GUI around
     */
    // fixme todo: if we are MUTE or sound is buggy, the intro will never end! use clicks?
    var INTRO_CINEMATIC_SCENECOUNT = 2; // was 6; but it got boring fast.

    return {

      // the intro NPC dialogue cinematic
      introCinematicSprites: [],
      currentIntroCinematicSprite: null,
      use_introCinematicBG: false,
      introCinematicBG: null,
      introSceneNumber: 0,
      soundIntroHasBeenPlayed: false,
      soundIntro1: null,
      introCinematicSceneLengthMS: [2500, 5000],

      // callbacks from the intro NPC dialogue voiceover sounds
      started: function introStarted() {
        if (debugmode)
          log('introStarted');
      },

      loaded: function introLoaded() {
        if (debugmode)
          log('introLoaded');
      },

      loadError: function introLoadError() {
        if (debugmode)
          log('introLoadError');
      },

      nextScene: function introNextScene() {
        if (debugmode)
          log('introNextScene');
        introCinematic();
      },

      
      cinematic: function introCinematic() {

        introSceneNumber++;

        if (introSceneNumber > INTRO_CINEMATIC_SCENECOUNT) {
          // fixme todo: good for click to skip intro:
          // if (soundIntro1) soundIntro1.stop();
          introSceneNumber = 999;
          currentIntroCinematicSprite = null;
          introCinematicBG = null;
          if (debugmode)
            log('introCinamatic is over: starting waves!');
          enemyWave.next_spawntime = timer.currentFrameTimestamp - 1; // NOW!
          return;
        }

        if (debugmode)
          log('introCinematic ' + introSceneNumber);

        if (!mute) {

          if (!soundIntroHasBeenPlayed) // only play ONCE. // if multi part intro, remove this check and uncomment soundSettings.urls below
          {
            if (debugmode)
              log('Playing the intro voiceover sound.');

            var soundSettings = {
              volume : 1.0, // 0 to 1
              buffer : false, // if true, stream using HTML5Audio - if false: wait for full download
              onplay : introStarted,
              onload : introLoaded,
              onloaderror : introLoadError,
              onend : introNextScene
            };

            // for intro-1.mp3 2,3,4,5 etc... WORKS!
            //soundSettings.urls = ['game-media/intro-' + introSceneNumber + '.mp3', 'game-media/intro-' + introSceneNumber + '.ogg', 'game-media/intro-' + introSceneNumber + '.wav'];

            soundSettings.urls = ['game-media/intro.mp3', 'game-media/intro.ogg', 'game-media/intro.wav'];
            soundIntro1 = new Howl(soundSettings).play();

            // wp8 sound hack: FIXME TODO
            sfx.play('intro');

            soundIntroHasBeenPlayed = true;

          }
        }

        // hardcoded timer for the intro dialog GUI part 2:
        // why? we can't rely on the sound onend to fire: buggy html5 sound
        window.setTimeout(introCinematic, introCinematicSceneLengthMS[introSceneNumber - 1]);
        // todo fixme: we click to skip the intro, this still fires. disabled: intro plays in full always.

        /*
        Your highness, the peasants are revolting.
        I know that, you fool! That's why we don't allow them in the castle!
        Yes, sire. The peasants have begun a rebellion and are storming the castle gates.
        Then assemble the royal guard. We must crush this uprising!
        Sadly, the guards are all indentured peasants. They've abandoned their posts.
        Very well. Summon the royal architect-mage. We must prepare the tower defenses!
         */

        // a fantasy map background always looks cool
        if (!introCinematicBG && use_introCinematicBG) {
          introCinematicBG = new jaws.Sprite({
              image : jaws.assets.get("map.png"),
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2) | 0,
              anchor : "center_center"
            });
        }

        // do we need to init the sprite?
        if (!introCinematicSprites[introSceneNumber]) {

          // centered middle
          //var spriteParams = { x: (jaws.width / 2) | 0, y: (jaws.height /2) | 0, anchor: "center_center" };
          // bottom of screen:
          var spriteParams = {
            x : (jaws.width / 2) | 0,
            y : (jaws.height - 64) | 0,
            anchor : "center_bottom"
          };

          introCinematicSprites[introSceneNumber] = extractSprite(jaws.assets.get("cinematic.png"), 0, 80 * (introSceneNumber - 1), 576, 80, spriteParams);

          // these are clickable (to skip the intro)
          // fixme todo buggy: skipping intro makes WAVE timings overlap! #seehere
          // button_sprites.push(introCinematicSprites[introSceneNumber]);
        }
        // don't let the previous one accept clicks
        if (currentIntroCinematicSprite)
          currentIntroCinematicSprite.action = null;
        currentIntroCinematicSprite = introCinematicSprites[introSceneNumber];
        // we now want to trap clicks on this sprite
        currentIntroCinematicSprite.action = introCinematicSkip;

      },

      skip: function introCinematicSkip() {
        if (debugmode)
          log('Skipping intro cinematic due to clicking a sprite in button_sprites that has an action()');
        introSceneNumber = 999;
        introCinematic();
      }

    };
  });