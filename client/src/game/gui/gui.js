angular.module('game.gui', [
  'game.gui.hud',
  'game.gui.background',
  'game.gui.build',
  'game.gui.sprite',
  'game.gui.tile',
  'game.gui.viewport'
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
      $log.debug('liquidLayoutGUI');

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

      if (waveGui.label)
        waveGui.label.moveTo(waveGui.x, waveGui.y);
      if (goldGui.label)
        goldGui.label.moveTo(goldGui.x, goldGui.y);
      if (healthGui.label)
        healthGui.label.moveTo(healthGui.x, healthGui.y);

      if (waveGui.instance) {
        for (n = 0; n < waveGui.digits; n++) {
          waveGui.instance.at(n + 1).moveTo(waveGui.x + waveGui.digits_offset + (waveGui.spacing * waveGui.digits) - (waveGui.spacing * n), waveGui.y);
        }
      }
      if (goldGui.instance) {
        for (n = 0; n < goldGui.digits; n++) {
          goldGui.instance.at(n + 1).moveTo(goldGui.x + goldGui.digits_offset + (goldGui.spacing * goldGui.digits) - (goldGui.spacing * n), goldGui.y);
        }
      }
      if (healthGui.instance) {
        for (n = 0; n < healthGui.digits; n++) {
          healthGui.instance.at(n + 1).moveTo(healthGui.x + healthGui.digits_offset + (healthGui.spacing * healthGui.digits) - (healthGui.spacing * n), healthGui.y);
        }
      }
    }
  };
});