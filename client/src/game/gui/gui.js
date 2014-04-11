angular.module('game.gui', [
  'game.gui.hud'
])

.factory('gui', funtion () {

  return {
    // gui
    need_to_draw_paused_sprite: false, // if we pause, render one more frame with PAUSED drawn on it
    msgboxSprite: undefined, // used for background of "paused" and after levels / gameover screen
    creditsSprite: undefined, // on overlay image with all the credits / about screen
    fontSpriteSheet: undefined, // the numbers 0..9
    guiSpriteSheet: undefined, // GUI overlays like the credits screen
    splashSprite: undefined, // the splash screen graphic used during the TitleScreenState game state
    levelSelectSprite: undefined, // the map parchment level select dialog
    menuSprite: undefined, // the un-wobbly menu menu sprite overlay
    levelcompleteSprite: undefined, // the words "level complete"
    gameoverSprite: undefined, // the words "game over"
    youloseSprite: undefined, // the words telling you WHY you failed
    beatTheGameSprite: undefined, // the game over desciption for beating the game
    menu_item_selected: 0, // 0=PLAY 1=CREDITS
    titleframecount: 0, // used for simple menu particle animation
    splashSpriteZoom: 0, // used only inside the TitleScreenState.update to zoom the logo in
    showing_credits: false, // used in TitleScreenState
    showing_levelselectscreen: false, // used in TitleScreenState
    noKeysPressedLastFrame: true, // only react to new keydowns
    CREDITS_BUTTON_X: 400, // default: gets changed in liquidLayoutGUI
    gui_enabled: true, // score/time/count - if false no GUI at all
    PausedGUI: undefined, // a sprite with the word "paused"

    /**
     * moves all GUI sprites around depending on window size
     * this function allows TowerGameStarterKit games to be "responsive"
     */
    liquidLayout: function liquidLayoutGUI() {
      if (debugmode)
        log('liquidLayoutGUI');

      var n = 0; // gui sprite loop counter

      CREDITS_BUTTON_X = (jaws.width / 2) | 0;
      // move any msgboxes/GUIs that are centered:
      if (gameoverSprite)
        gameoverSprite.moveTo((jaws.width / 2) | 0, ((jaws.height / 2) | 0) - 42);
      if (beatTheGameSprite)
        beatTheGameSprite.moveTo((jaws.width / 2) | 0, ((jaws.height / 2) | 0) + 42);
      if (levelcompleteSprite)
        levelcompleteSprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      if (menuSprite)
        menuSprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2 + 40) | 0);
      if (creditsSprite)
        creditsSprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      if (splashSprite)
        splashSprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      if (msgboxSprite)
        msgboxSprite.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0); // (jaws.height / 2 + 8) | 0); if the shadow makes it not vistually centered
      if (PausedGUI)
        PausedGUI.moveTo((jaws.width / 2) | 0, (jaws.height / 2) | 0);
      // move the gui timer/score/count

      if (WaveGUIlabel)
        WaveGUIlabel.moveTo(wave_gui_x, wave_gui_y);
      if (GoldGUIlabel)
        GoldGUIlabel.moveTo(gold_gui_x, gold_gui_y);
      if (HealthGUIlabel)
        HealthGUIlabel.moveTo(health_gui_x, health_gui_y);

      if (WaveGUI) {
        for (n = 0; n < wave_gui_digits; n++) {
          WaveGUI.at(n + 1).moveTo(wave_gui_x + wave_gui_digits_offset + (wave_gui_spacing * wave_gui_digits) - (wave_gui_spacing * n), wave_gui_y);
        }
      }
      if (GoldGUI) {
        for (n = 0; n < gold_gui_digits; n++) {
          GoldGUI.at(n + 1).moveTo(gold_gui_x + gold_gui_digits_offset + (gold_gui_spacing * gold_gui_digits) - (gold_gui_spacing * n), gold_gui_y);
        }
      }
      if (HealthGUI) {
        for (n = 0; n < health_gui_digits; n++) {
          HealthGUI.at(n + 1).moveTo(health_gui_x + health_gui_digits_offset + (health_gui_spacing * health_gui_digits) - (health_gui_spacing * n), health_gui_y);
        }
      }
    }
  };
});