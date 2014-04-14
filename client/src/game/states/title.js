angular.module('game.states.title', [
  'game.states.intro',
  'game.ui.sprite',
  'game.ui.gui',
  'game.ui.hud',
  'game.ui.background',
  'game.engine.timer',
  'game.engine.particles',
  'game.engine.sfx',
  'game.engine.level'
])

/**
 * A jaws state object for a simplistic title screen.
 * Note that many inits are performed for sprites that are used
 * by the other states; if you remove the titlescreen,
 * be sure to create these sprites elsewhere.
 */
.factory('titleState', function ($injector, $log, sprite, timer, intro, gui, particleSystem, hud, background, sfx, level) {

  /**
   * Click/touch event that fires when the user selects a level from the menu
   */
  function levelSelectClick(px, py) {
    $log.debug('levelSelectClick' + px + ',' + py);
    sfx.play('mapclick');

    // the map is split into quadrants - which island did we click?
    if ((px < jaws.width / 2) && (py < jaws.height / 2)) {
      $log.debug('Selected LEVEL 0');
      level.starting_level_number = 0;
    
    } else if ((px >= jaws.width / 2) && (py < jaws.height / 2)) {
      $log.debug('Selected LEVEL 1');
      level.starting_level_number = 1;
    
    } else if ((px < jaws.width / 2) && (py >= jaws.height / 2)) {
      $log.debug('Selected LEVEL 2');
      level.starting_level_number = 2;
    
    } else if ((px >= jaws.width / 2) && (py >= jaws.height / 2)) {
      $log.debug('Selected LEVEL 3');
      level.starting_level_number = 3;
    }

    $injector.get('game').start();
  }

  var titleScreen = {
    setup: function setup() {
      $log.debug('titleState.setup');

      // used only for the particle decorations
      gui.title_frame_count = 0;

      // if the game is running in a web page, we may want the loading screen to be invisible
      // CSS display:none, and the game will only appear when ready to play: harmless if unhidden/app.
      jaws.canvas.style.display = 'block';

      timer.game_paused = 3; // special paused setting: MENU MODE
      intro.sound_has_been_played = false; // so that next game we start, we hear it again

      // allow keyboard input and prevent browser from getting these events
      jaws.preventDefaultKeys(["w", "a", "s", "d", "p", "space", "z", "up", "down", "right", "left"]);

      // the main menu background
      if (!gui.splash_sprite) {
        gui.splash_sprite = new jaws.Sprite({
          image : "map/titlescreen.png",
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2) | 0,
          anchor : "center_center"
        });
      }

      // the level select screen - the second phase of our title screen main menu
      if (!gui.level_select_sprite) {
        gui.level_select_sprite = new jaws.Sprite({
          image : "map/level-select-screen.png",
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2) | 0,
          anchor : "center_center"
        });
      }

      // so we can trap clicks on the map sprite
      gui.level_select_sprite.action = levelSelectClick;

      sprite.init();

      // reset in between play sessions - a list of clickable buttons
      sprite.button_sprites = new jaws.SpriteList(); /// see handlers.clickMaybe()
      sprite.button_sprites.push(gui.level_select_sprite);

      // the msgbox background - used for pause screen, gameover, level transitions
      if (!gui.msgbox_sprite) {
        gui.msgbox_sprite = new jaws.Sprite({
          image : "map/msgbox.png",
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2) | 0,
          anchor : "center_center"
        });
      }

      // the numbers 0..9 in 32x32 spritesheet fontmap
      // then we can use gui.font_sheet.frames[num]
      $log.debug("Chopping up font spritesheet...");

      if (!gui.font_sheet) {
        gui.font_sheet = new jaws.SpriteSheet({
          image : "font/font.png",
          frame_size : [32, 32],
          orientation : 'down'
        });
      }

      // the gui image has all sorts of labels, the credits screen, etc.
      if (!gui.sprite_sheet) {
        gui.sprite_sheet = new jaws.Sprite({
          image : "gui/gui.png"
        });
      }

      // the credits screen
      if (!gui.credits_sprite) {
        gui.credits_sprite = sprite.extract(gui.sprite_sheet.image, 0, 32 * 17, 352, 224, {
          x : (jaws.width / 2) | 0,
          y : ((jaws.height / 2) | 0) - 8,
          anchor : "center_center"
        });
      }

      // particle system - one explosion per sprite
      if (particleSystem.particles_enabled) {

        if (!particleSystem.particles) {
          particleSystem.particles = new jaws.SpriteList();
        }

        // every frame of every particle animation
        if (!particleSystem.allparticleframes) {
          $log.debug("Chopping up particle animation spritesheet...");

          particleSystem.allparticleframes = new jaws.Animation({
            sprite_sheet : jaws.assets.get("sprite/particles.png"),
            frame_size : particleSystem.framesize,
            frame_duration : particleSystem.frame_ms,
            orientation : 'right'
          });
        }
      }

      var goldGui = hud.get('gold');
      var waveGui = hud.get('wave');
      var healthGui = hud.get('health');

      goldGui.displayed_gold = 0; // we increment displayed score by 1 each frame until it shows true player.gold

      // the HUD gui sprites: score, etc.
      if (gui.gui_enabled) {

        var n = 0; // temp loop counter

        if (!waveGui.label) {
          waveGui.label = sprite.extract(gui.sprite_sheet.image, 0, 32 * 14, 256, 32, {
            x : waveGui.x,
            y : waveGui.y,
            anchor : "top_left"
          });
        }

        if (!goldGui.label) {
          goldGui.label = sprite.extract(gui.sprite_sheet.image, 0, 32 * 16, 256, 32, {
            x : goldGui.x,
            y : goldGui.y,
            anchor : "top_left"
          });
        }

        if (!healthGui.label) {
          healthGui.label = sprite.extract(gui.sprite_sheet.image, 0, 32 * 15, 256, 32, {
            x : healthGui.x,
            y : healthGui.y,
            anchor : "top_left"
          });
        }

        if (!gui.paused_sprite) {
          gui.paused_sprite = sprite.extract(gui.sprite_sheet.image, 0, 32 * 13, 352, 32, {
            x : (jaws.width / 2) | 0,
            y : (jaws.height / 2) | 0,
            anchor : "center_center"
          });
        }

        if (!waveGui.instance) {
          $log.debug('creating wave gui');

          waveGui.instance = new jaws.SpriteList();
          
          // the label
          waveGui.instance.push(waveGui.label);
          
          // eg 00000 from right to left
          for (n = 0; n < waveGui.digits; n++) {
            hud.get('wave').instance.push(new jaws.Sprite({
              x : waveGui.x + waveGui.digits_offset + (waveGui.spacing * waveGui.digits) - (waveGui.spacing * n),
              y : waveGui.y,
              image : gui.font_sheet.frames[0],
              anchor : "top_left"
            }));
          }
        }

        // these are sprite lists containing 0..9 digit tiles, ordered from right to left (1s, 10s, 100s, etc)
        if (!goldGui.instance) {
          $log.debug('creating gold gui');

          goldGui.instance = new jaws.SpriteList();
          
          // the label
          goldGui.instance.push(goldGui.label);
          
          // eg 00000 from right to left
          for (n = 0; n < goldGui.digits; n++) {
            goldGui.instance.push(new jaws.Sprite({
              x : goldGui.x + goldGui.digits_offset + (goldGui.spacing * goldGui.digits) - (goldGui.spacing * n),
              y : goldGui.y,
              image : gui.font_sheet.frames[0],
              anchor : "top_left"
            }));
          }
        }

        if (!healthGui.instance) {
          $log.debug('creating health gui');

          healthGui.instance = new jaws.SpriteList();
          
          // the label
          healthGui.instance.push(healthGui.label);
          
          // eg 00000 from right to left
          for (n = 0; n < healthGui.digits; n++) {
            healthGui.instance.push(new jaws.Sprite({
              x : healthGui.x + healthGui.digits_offset + (healthGui.spacing * healthGui.digits) - (healthGui.spacing * n),
              y : healthGui.y,
              image : gui.font_sheet.frames[0],
              anchor : "top_left"
            }));
          }
        }
      }

      // create all the sprites used by the GUI
      if (!gui.menu_sprite) {
        gui.menu_sprite = new jaws.Sprite({
          image : sprite.chop(gui.sprite_sheet.image, 0, 32 * 10, 352, 32 * 2),
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2 + 40) | 0,
          anchor : "center_center",
          flipped : false
        });
      }
      
      if (!gui.level_complete_sprite) {
        gui.level_complete_sprite = new jaws.Sprite({
          image : sprite.chop(gui.sprite_sheet.image, 0, 0, 352, 128),
          x : (jaws.width / 2) | 0,
          y : (jaws.height / 2) | 0,
          anchor : "center_center",
          flipped : false
        });
      }

      if (!gui.gameover_sprite) {
        gui.gameover_sprite = new jaws.Sprite({
          image : sprite.chop(gui.sprite_sheet.image, 0, 128, 352, 64),
          x : (jaws.width / 2) | 0,
          y : ((jaws.height / 2) | 0) - 42,
          anchor : "center_center",
          flipped : false
        });
      }
      
      if (!gui.youlose_sprite) {
        gui.youlose_sprite = new jaws.Sprite({
          image : sprite.chop(gui.sprite_sheet.image, 0, 192, 352, 64),
          x : (jaws.width / 2) | 0,
          y : ((jaws.height / 2) | 0) + 42,
          anchor : "center_center",
          flipped : false
        });
      }

      if (!gui.game_won_sprite) {
        gui.game_won_sprite = new jaws.Sprite({
          image : sprite.chop(gui.sprite_sheet.image, 0, 256, 352, 64),
          x : (jaws.width / 2) | 0,
          y : ((jaws.height / 2) | 0) + 42,
          anchor : "center_center",
          flipped : false
        });
      }

      // move all gui elements around in a window size independent way (responsive liquid layout)
      if (gui.gui_enabled) {
        gui.liquidLayout();
      }

      // trigger a menu press if we click anywhere: uses the pos to determine which menu item was clicked
      window.addEventListener("mousedown", $injector.get('game').unPause, false);

      // scrolling background images
      if (background.use_parallax_background_titlescreen) {

        if (!background.title_background) {
          background.title_background = new jaws.Parallax({
            repeat_x : true,
            repeat_y : true
          });

          background.title_background.addLayer({
            image : "map/titlebackground.png",
            damping : 1
          });
        }
      }

    }, 

    update: function update() {

      // title screen zooms in - this could be a nice tween fixme todo
      gui.splash_sprite_zoom += 0.01;

      if (gui.splash_sprite_zoom > 1) {
        gui.splash_sprite_zoom = 1;
      }

      gui.splash_sprite.scaleTo(gui.splash_sprite_zoom);

      // show which item we have currently selected - about 25 visible at any one time
      // only draws after the title screen is fully zoomed in
      if (gui.title_frame_count % 5 === 0 && gui.splash_sprite_zoom > 0.99) {
        if (gui.menu_item_selected === 0) {
          particleSystem.start(jaws.width / 2 - 16 - (Math.random() * 272), jaws.height / 2 + 32 + (Math.random() * 80));
        } else {
          particleSystem.start(jaws.width / 2 + 16 + (Math.random() * 272), jaws.height / 2 + 32 + (Math.random() * 80));
        }
      }

      if (jaws.pressed("down") || jaws.pressed("right")) {
        $log.debug('credits button highlighted');

        gui.title_frame_count = 60; // reset particleSystem.particles immediately
        gui.menu_item_selected = 1;
      }

      if (jaws.pressed("up") || jaws.pressed("left")) {
        $log.debug('start button highlighted');

        gui.title_frame_count = 60; // reset particleSystem.particles immediately
        gui.menu_item_selected = 0;
      }

      // after gameover, debounce since you are holding down a key on prev frame
      if (gui.no_keys_pressed_last_frame) {
        
        if (jaws.pressed("enter") || jaws.pressed("space") || jaws.pressed("left_mouse_button") || !timer.game_paused) {

          sfx.play('menuclick');
          $log.debug('Titlescreen click at ' + jaws.mouse_x + ',' + jaws.mouse_y + ' and gui.credits_button_x=' + gui.credits_button_x);

          // touch and mouse don't take keyboard gui.menu_item_selected "highlight" into account
          // touch also never updates jaws.pressed("left_mouse_button")
          var just_hid_the_credits = false;
          
          if (gui.showing_credits) {
            $log.debug('Titlescreen HIDING CREDITS.');

            gui.showing_credits = false;
            gui.menu_item_selected = 0;
            timer.game_paused = 3; // reset
            just_hid_the_credits = true;

          } else { // normal menu was clicked
          
            if (jaws.mouse_x <= gui.credits_button_x) {
              $log.debug('Titlescreen PLAY CLICKED!');
              gui.menu_item_selected = 0;
            
            } else {
              $log.debug('Titlescreen CREDITS CLICKED!');
              gui.menu_item_selected = 1;
            }
          }

          if (!just_hid_the_credits) {

            if (gui.menu_item_selected == 1) {
              $log.debug('Titlescreen SHOWING CREDITS!');

              gui.showing_credits = true;
              gui.showing_level_select_screen = false;
              timer.game_paused = 3; // reset
            
            } else { // user wants to start the game!
              $log.debug('Titlescreen SHOWING MAP!');
              
              //Show the map and wait for levelSelectScreen's handlers.clickMaybe() to start the game
              gui.showing_credits = false;
              gui.showing_level_select_screen = true;
            }
          }
        }
      }

      // ensure that we don't react to a press/key/click more than once
      if (!(jaws.pressed("enter")) && !(jaws.pressed("space")) && !(jaws.pressed("left_mouse_button")) && (timer.game_paused === 3)) {
        // this "debounces" keypresses so you don't
        // trigger every single frame when holding down a key
        gui.no_keys_pressed_last_frame = true;

      } else {    
        gui.no_keys_pressed_last_frame = false;
      }

      if (particleSystem.particles_enabled) {
        particleSystem.update();
      }
        
      gui.title_frame_count++;

    },

    draw: function draw() {

      if (background.use_parallax_background_titlescreen && background.title_background) {
        background.title_background.draw();
      } else { // no parallax: use colour
        jaws.context.fillStyle = background.color;
        jaws.context.fillRect(0, 0, jaws.width, jaws.height);
      }

      if (gui.need_to_draw_paused_sprite) {
        gui.paused_sprite.draw();
      } else {

        if (gui.showing_credits) {
          // just in case a previous level transition set the scale
          gui.msgbox_sprite.scaleTo(1);
          gui.msgbox_sprite.draw();
          gui.credits_sprite.draw();

        } else if (gui.showing_level_select_screen) {
          gui.level_select_sprite.draw();
        
        } else {
          gui.splash_sprite.draw();
          if (particleSystem.particles_enabled) {
            particleSystem.particles.draw();
          }
        }
      }
    }
  };

  return titleScreen;
});