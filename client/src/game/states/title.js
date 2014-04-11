angular.module('game.states.title', [])

  // GAME STATE: THE TITLE SCREEN
  /**
   * A jaws state object for a simplistic title screen.
   * Note that many inits are performed for sprites that are used
   * by the other states; if you remove the titlescreen,
   * be sure to create these sprites elsewhere.
   */
  .factory('TitleScreenState', function () {

    return function TitleScreenState() {

      /**
       * init function for the titlescreen state
       * also used to create sprites on first run
       */
      this.setup = function () {

        if (debugmode)
          log('TitleScreenState.setup');

        // special message that tells C# whether or not to send back button events to js or handle natively
        console.log('[STOP-SENDING-BACK-BUTTON-EVENTS]');

        // wp8: try to reclaim some RAM that was used during inits/asset downloading
        if (typeof(window.CollectGarbage) == "function") {
          window.CollectGarbage();
          if (debugmode)
            log('TitleScreenState.setup just did a CollectGarbage()');
        }

        // used only for the particle decorations
        titleframecount = 0;

        // if the game is running in a web page, we may want the loading screen to be invisible
        // CSS display:none, and the game will only appear when ready to play: harmless if unhidden/app.
        jaws.canvas.style.display = 'block';

        game_paused = 3; // special paused setting: MENU MODE
        soundIntroHasBeenPlayed = false; // so that next game we start, we hear it again

        // allow keyboard input and prevent browser from getting these events
        jaws.preventDefaultKeys(["w", "a", "s", "d", "p", "space", "z", "up", "down", "right", "left"]);

        // an html gui element (using the DOM!) with the FPS and debug profile stats
        info_tag = document.getElementById("info");

        // the main menu background
        if (!splashSprite)
          splashSprite = new jaws.Sprite({
              image : "titlescreen.png",
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2) | 0,
              anchor : "center_center"
            });

        // the level select screen - the second phase of our title screen main menu
        if (!levelSelectSprite)
          levelSelectSprite = new jaws.Sprite({
              image : "level-select-screen.png",
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2) | 0,
              anchor : "center_center"
            });
        // so we can trap clicks on the map sprite
        levelSelectSprite.action = levelSelectClick;

        // reset in between play sessions - a list of clickable buttons
        guiButtonSprites = new jaws.SpriteList(); /// see guiClickMaybe()
        guiButtonSprites.push(levelSelectSprite);

        // the msgbox background - used for pause screen, gameover, level transitions
        if (!msgboxSprite)
          msgboxSprite = new jaws.Sprite({
              image : "msgbox.png",
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2) | 0,
              anchor : "center_center"
            });

        // the numbers 0..9 in 32x32 spritesheet fontmap
        // then we can use fontSpriteSheet.frames[num]
        if (debugmode)
          log("Chopping up font spritesheet...");
        if (!fontSpriteSheet)
          fontSpriteSheet = new jaws.SpriteSheet({
              image : "font.png",
              frame_size : [32, 32],
              orientation : 'down'
            });

        // the gui image has all sorts of labels, the credits screen, etc.
        if (!guiSpriteSheet)
          guiSpriteSheet = new jaws.Sprite({
              image : "gui.png"
            });

        // the credits screen
        if (!creditsSprite)
          creditsSprite = extractSprite(guiSpriteSheet.image, 0, 32 * 17, 352, 224, {
              x : (jaws.width / 2) | 0,
              y : ((jaws.height / 2) | 0) - 8,
              anchor : "center_center"
            });

        // particle system - one explosion per sprite
        if (particles_enabled) {
          if (!particles)
            particles = new jaws.SpriteList();
          // every frame of every particle animation
          if (!allparticleframes) {
            if (debugmode)
              log("Chopping up particle animation spritesheet...");
            allparticleframes = new jaws.Animation({
                sprite_sheet : jaws.assets.get("particles.png"),
                frame_size : particle_framesize,
                frame_duration : PARTICLE_FRAME_MS,
                orientation : 'right'
              });
          }
        }

        displayedGold = 0; // we increment displayed score by 1 each frame until it shows true player_Gold

        // the HUD gui sprites: score, etc.
        if (gui_enabled) {

          var n = 0; // temp loop counter

          if (!WaveGUIlabel)
            WaveGUIlabel = extractSprite(guiSpriteSheet.image, 0, 32 * 14, 256, 32, {
                x : wave_gui_x,
                y : wave_gui_y,
                anchor : "top_left"
              });
          if (!GoldGUIlabel)
            GoldGUIlabel = extractSprite(guiSpriteSheet.image, 0, 32 * 16, 256, 32, {
                x : gold_gui_x,
                y : gold_gui_y,
                anchor : "top_left"
              });
          if (!HealthGUIlabel)
            HealthGUIlabel = extractSprite(guiSpriteSheet.image, 0, 32 * 15, 256, 32, {
                x : health_gui_x,
                y : health_gui_y,
                anchor : "top_left"
              });
          if (!PausedGUI)
            PausedGUI = extractSprite(guiSpriteSheet.image, 0, 32 * 13, 352, 32, {
                x : (jaws.width / 2) | 0,
                y : (jaws.height / 2) | 0,
                anchor : "center_center"
              });

          if (!WaveGUI) {
            if (debugmode)
              log('creating wave gui');
            WaveGUI = new jaws.SpriteList();
            // the label
            WaveGUI.push(WaveGUIlabel);
            // eg 00000 from right to left
            for (n = 0; n < wave_gui_digits; n++) {
              WaveGUI.push(new jaws.Sprite({
                  x : wave_gui_x + wave_gui_digits_offset + (wave_gui_spacing * wave_gui_digits) - (wave_gui_spacing * n),
                  y : wave_gui_y,
                  image : fontSpriteSheet.frames[0],
                  anchor : "top_left"
                }));
            }
          }

          // these are sprite lists containing 0..9 digit tiles, ordered from right to left (1s, 10s, 100s, etc)
          if (!GoldGUI) {
            if (debugmode)
              log('creating gold gui');
            GoldGUI = new jaws.SpriteList();
            // the label
            GoldGUI.push(GoldGUIlabel);
            // eg 00000 from right to left
            for (n = 0; n < gold_gui_digits; n++) {
              GoldGUI.push(new jaws.Sprite({
                  x : gold_gui_x + gold_gui_digits_offset + (gold_gui_spacing * gold_gui_digits) - (gold_gui_spacing * n),
                  y : gold_gui_y,
                  image : fontSpriteSheet.frames[0],
                  anchor : "top_left"
                }));
            }
          }

          if (!HealthGUI) {
            if (debugmode)
              log('creating health gui');
            HealthGUI = new jaws.SpriteList();
            // the label
            HealthGUI.push(HealthGUIlabel);
            // eg 00000 from right to left
            for (n = 0; n < health_gui_digits; n++) {
              HealthGUI.push(new jaws.Sprite({
                  x : health_gui_x + health_gui_digits_offset + (health_gui_spacing * health_gui_digits) - (health_gui_spacing * n),
                  y : health_gui_y,
                  image : fontSpriteSheet.frames[0],
                  anchor : "top_left"
                }));
            }
          }
        } // if (gui_enabled)

        // create all the sprites used by the GUI
        if (!menuSprite)
          menuSprite = new jaws.Sprite({
              image : chopImage(guiSpriteSheet.image, 0, 32 * 10, 352, 32 * 2),
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2 + 40) | 0,
              anchor : "center_center",
              flipped : false
            });
        if (!levelcompleteSprite)
          levelcompleteSprite = new jaws.Sprite({
              image : chopImage(guiSpriteSheet.image, 0, 0, 352, 128),
              x : (jaws.width / 2) | 0,
              y : (jaws.height / 2) | 0,
              anchor : "center_center",
              flipped : false
            });
        if (!gameoverSprite)
          gameoverSprite = new jaws.Sprite({
              image : chopImage(guiSpriteSheet.image, 0, 128, 352, 64),
              x : (jaws.width / 2) | 0,
              y : ((jaws.height / 2) | 0) - 42,
              anchor : "center_center",
              flipped : false
            });
        if (!youloseSprite)
          youloseSprite = new jaws.Sprite({
              image : chopImage(guiSpriteSheet.image, 0, 192, 352, 64),
              x : (jaws.width / 2) | 0,
              y : ((jaws.height / 2) | 0) + 42,
              anchor : "center_center",
              flipped : false
            });
        if (!beatTheGameSprite)
          beatTheGameSprite = new jaws.Sprite({
              image : chopImage(guiSpriteSheet.image, 0, 256, 352, 64),
              x : (jaws.width / 2) | 0,
              y : ((jaws.height / 2) | 0) + 42,
              anchor : "center_center",
              flipped : false
            });

        // move all gui elements around in a window size independent way (responsive liquid layout)
        if (gui_enabled)
          liquidLayoutGUI();

        // trigger a menu press if we click anywhere: uses the pos to determine which menu item was clicked
        window.addEventListener("mousedown", unPause, false);

        // scrolling background images
        if (use_parallax_background_titlescreen) {
          if (!titlebackground) {
            titlebackground = new jaws.Parallax({
                repeat_x : true,
                repeat_y : true
              }); // skelevator: was repeat_y: false
            titlebackground.addLayer({
              image : "titlebackground.png",
              damping : 1
            });
            //titlebackground.addLayer({ image: "parallaxlayer2.png", damping: 8 });
          }
        }

      }; // title screen setup function

      /**
       * update function (run every frame) for the titlescreen
       */
      this.update = function () {

        // title screen zooms in - this could be a nice tween fixme todo
        splashSpriteZoom += 0.01;
        if (splashSpriteZoom > 1)
          splashSpriteZoom = 1;
        splashSprite.scaleTo(splashSpriteZoom);

        if (use_parallax_background_titlescreen) {
          // update parallax background scroll
          //titlebackground.camera_y -= 4; // skelevator: was _x += 4
        }

        // show which item we have currently selected - about 25 visible at any one time
        // only draws after the title screen is fully zoomed in
        if (titleframecount % 5 == 0 && splashSpriteZoom > 0.99) {
          if (menu_item_selected == 0)
            startParticleSystem(jaws.width / 2 - 16 - (Math.random() * 272), jaws.height / 2 + 32 + (Math.random() * 80));
          else
            startParticleSystem(jaws.width / 2 + 16 + (Math.random() * 272), jaws.height / 2 + 32 + (Math.random() * 80));
        }

        if (jaws.pressed("down") ||
          jaws.pressed("right")) {
          if (debugmode)
            log('credits button highlighted');
          titleframecount = 60; // reset particles immediately
          menu_item_selected = 1;
        }

        if (jaws.pressed("up") ||
          jaws.pressed("left")) {
          if (debugmode)
            log('start button highlighted');
          titleframecount = 60; // reset particles immediately
          menu_item_selected = 0;
        }

        // after gameover, debounce since you are holding down a key on prev frame
        if (noKeysPressedLastFrame) {
          if (jaws.pressed("enter") ||
            jaws.pressed("space") ||
            jaws.pressed("left_mouse_button") ||
            (!game_paused) // title screen done: onmousedown event only
          ) {

            sfx.play('menuclick'); // wp8

            if (debugmode)
              log('Titlescreen click at ' + jaws.mouse_x + ',' + jaws.mouse_y + ' and CREDITS_BUTTON_X=' + CREDITS_BUTTON_X);

            // touch and mouse don't take keyboard menu_item_selected "highlight" into account
            // touch also never updates jaws.pressed("left_mouse_button")
            var justHidTheCredits = false;
            if (showing_credits) {
              if (debugmode)
                log('Titlescreen HIDING CREDITS.');
              showing_credits = false;
              menu_item_selected = 0;
              game_paused = 3; // reset
              justHidTheCredits = true;
              // special message that tells C# whether or not to send back button events to js or handle natively
              console.log('[STOP-SENDING-BACK-BUTTON-EVENTS]');
            } else // normal menu was clicked
            {
              if (jaws.mouse_x <= CREDITS_BUTTON_X) {
                if (debugmode)
                  log('Titlescreen PLAY CLICKED!');
                menu_item_selected = 0;
              } else {
                if (debugmode)
                  log('Titlescreen CREDITS CLICKED!');
                menu_item_selected = 1;
                // special message that tells C# whether or not to send back button events to js or handle natively
                console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');
              }
            }

            if (!justHidTheCredits) {
              if (menu_item_selected == 1) {
                if (debugmode)
                  log('Titlescreen SHOWING CREDITS!');
                showing_credits = true;
                showing_levelselectscreen = false;
                game_paused = 3; // reset
                // special message that tells C# whether or not to send back button events to js or handle natively
                console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');
              } else // user wants to start the game!
              {
                if (debugmode)
                  log('Titlescreen SHOWING MAP!');
                //Show the map and wait for levelSelectScreen's guiClickMaybe() to start the game
                showing_credits = false;
                showing_levelselectscreen = true;
                //startGameNow(); // is this redundant: called by levelSelectClick()
                // special message that tells C# whether or not to send back button events to js or handle natively
                console.log('[SEND-BACK-BUTTON-EVENTS-PLEASE]');
              }
            }
          }
        }

        // ensure that we don't react to a press/key/click more than once
        if (!(jaws.pressed("enter")) && !(jaws.pressed("space")) && !(jaws.pressed("left_mouse_button")) && (game_paused == 3)) {
          // this "debounces" keypresses so you don't
          // trigger every single frame when holding down a key
          noKeysPressedLastFrame = true;
        } else {
          noKeysPressedLastFrame = false;
        }

        if (particles_enabled)
          updateParticles();

        titleframecount++;

      }; // title screen update function

      /**
       * render function for the titlescreen
       */
      this.draw = function () {

        if (use_parallax_background_titlescreen && titlebackground) {
          titlebackground.draw();
        } else { // no parallax: use colour
          jaws.context.fillStyle = background_colour;
          jaws.context.fillRect(0, 0, jaws.width, jaws.height);
        }

        if (need_to_draw_paused_sprite) {
          PausedGUI.draw();
        } else {

          if (showing_credits) {
            // just in case a previous level transition set the scale
            msgboxSprite.scaleTo(1);
            msgboxSprite.draw();
            creditsSprite.draw();
          } else if (showing_levelselectscreen) {
            levelSelectSprite.draw();
          } else {
            splashSprite.draw();
            if (particles_enabled)
              particles.draw();
            //menuSprite.draw();
          }
        }

      }; // title screen draw function

    };
  });