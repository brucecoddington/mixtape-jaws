angular.module('game.ui.gui', [
  'game.ui.hud',
  'game.entities.player'
])

.factory('gui', function ($log, waveGui, goldGui, healthGui, player) {

  var gui = {
    // gui
    need_to_draw_paused_sprite: false, // if we pause, render one more frame with PAUSED drawn on it
    msgbox_sprite: undefined, // used for background of "paused" and after levels / gameover screen
    credits_sprite: undefined, // on overlay image with all the credits / about screen
    font_sheet: undefined, // the numbers 0..9
    sprite_sheet: undefined, // GUI overlays like the credits screen
    splash_sprite: undefined, // the splash screen graphic used during the titleState game state
    level_select_sprite: undefined, // the map parchment level select dialog
    menu_sprite: undefined, // the un-wobbly menu menu sprite overlay
    level_complete_sprite: undefined, // the words "level complete"
    gameover_sprite: undefined, // the words "game over"
    youlose_sprite: undefined, // the words telling you WHY you failed
    game_won_sprite: undefined, // the game over desciption for beating the game
    menu_item_selected: 0, // 0=PLAY 1=CREDITS
    title_frame_count: 0, // used for simple menu particle animation
    splash_sprite_zoom: 0, // used only inside the titleState.update to zoom the logo in
    showing_credits: false, // used in titleState
    showing_level_select_screen: false, // used in titleState
    no_keys_pressed_last_frame: true, // only react to new keydowns
    credits_button_x: 400, // default: gets changed in liquidLayout
    gui_enabled: true, // score/time/count - if false no GUI at all
    paused_sprite: undefined, // a sprite with the word "paused"

    /**
     * moves all GUI sprites around depending on window size
     * this function allows TowerGameStarterKit games to be "responsive"
     */
    liquidLayout: function liquidLayout() {
      $log.debug('liquidLayout');

      var n = 0; // gui sprite loop counter

      gui.credits_button_x = (jaws.width / 2) | 0;

      // move any msgboxes/GUIs that are centered:
      if (gui.gameover_sprite) {
        gui.gameover_sprite.moveTo((jaws.width / 2) | 0, ((jaws.height / 2) | 0) - 42);
      }
      
      if (gui.game_won_sprite) {
        gui.game_won_sprite.moveTo((jaws.width / 2) | 0, ((jaws.height / 2) | 0) + 42);
      }

      if (gui.level_complete_sprite) {
        gui.level_complete_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      }

      if (gui.menu_sprite) {
        gui.menu_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2 + 40) | 0);
      }

      if (gui.credits_sprite) {
        gui.credits_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      }

      if (gui.splash_sprite) {
        gui.splash_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      }

      if (gui.msgbox_sprite) {
        gui.msgbox_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0); // (jaws.height / 2 + 8) | 0); if the shadow makes it not vistually centered
      }

      if (gui.paused_sprite) {
        gui.paused_sprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      }
      
      if (waveGui.label) {
        waveGui.label.moveTo(waveGui.x, waveGui.y);
      }

      if (goldGui.label) {
        goldGui.label.moveTo(goldGui.x, goldGui.y);
      }

      if (healthGui.label) {
        healthGui.label.moveTo(healthGui.x, healthGui.y);
      }

      if (hud.get('wave').instance) { 
        for (n = 0; n < waveGui.digits; n++) {
          hud.get('wave').instance.at(n + 1).moveTo(waveGui.x + waveGui.digits_offset + (waveGui.spacing * waveGui.digits) - (waveGui.spacing * n), waveGui.y);
        }
      }

      if (hud.get('gold').instance) {
        for (n = 0; n < goldGui.digits; n++) {
          hud.get('gold').instance.at(n + 1).moveTo(goldGui.x + goldGui.digits_offset + (goldGui.spacing * goldGui.digits) - (goldGui.spacing * n), goldGui.y);
        }
      }
      
      if (hud.get('health').instance) {
        for (n = 0; n < healthGui.digits; n++) {
          hud.get('health').instance.at(n + 1).moveTo(healthGui.x + healthGui.digits_offset + (healthGui.spacing * healthGui.digits) - (healthGui.spacing * n), healthGui.y);
        }
      }
    },

    /**
     * Changes the sprites used by a SpriteList (score, time, counter, etc) eg. 00000FAR_AWAY9
     * updateGui cannot handle negative numbers: only 0..9 in the spritesheet
     */
    updateGui: function updateGui(guiToUpdate, num) {
      if (!gui.gui_enabled) {
        return;
      }

      // individual digits
      var digitcount = 0;
      var digit = 0;
      var digitsprite = guiToUpdate.at(digitcount + 1); // +1 because the "label" is the first sprite

      while (digitsprite) {
        digit = Math.floor(num % 10);

        if (digit < 0) {
          digit = 0; // eg if num is -1
        }
          
        num = Math.floor(num / 10);
        digitsprite.setImage(gui.font_sheet.frames[digit]);
        digitcount++;
        digitsprite = guiToUpdate.at(digitcount + 1);
      }
    },

    /**
     * Changes the sprites used by the hud.get('gold').instance,
     * counting by 1 each call until we reach player.gold
     */
    updateGold: function updateGold() {
      if (goldGui.displayed_gold === player.gold) {
        return;
      }

      // don't fall too far behind
      if (Math.abs(player.gold - goldGui.displayed_gold) > 200) {
        goldGui.displayed_gold = player.gold;

      } else {
        
        if (player.gold > goldGui.displayed_gold) {
          goldGui.displayed_gold++;
        } else {
          goldGui.displayed_gold--;
        }
      }

      gui.updateGui(hud.get('gold').instance, goldGui.displayed_gold);
    }
  };

  return gui;
});