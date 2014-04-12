angular.module('data.preload', [])
  .factory('preload', function () {
    
    return {
      all_game_assets_go_here: "game-media/",
      all_game_assets: [
        "titlescreen.png",
        "gui.png",
        "font.png",
        "level0.png",
        "level1.png",
        "level2.png",
        "level3.png",
        "level-select-screen.png",
        "titlebackground.png", // this is 1920x1080 and uses up about 4MB - if RAM is an issue, comment out this line and set background.use_parallax_background_titlescreen = false
        "cinematic.png",
        "particles.png",
        "msgbox.png",
        "entities.png",
        "buildmenu.png",
        "unit1.png",
        "unit2.png",
        "unit3.png",
        "unit4.png"
      ]
    };
      
  });