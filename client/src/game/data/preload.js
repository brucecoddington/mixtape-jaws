angular.module('data.preload', [])
  .factory('preload', function () {
    
    return {
      all_game_assets_go_here: "assets/map/",
      all_game_assets: [
        "map/titlescreen.png",
        "gui/gui.png",
        "font/font.png",
        "map/level0.png",
        "map/level1.png",
        "map/level2.png",
        "map/level3.png",
        "map/level-select-screen.png",
        "map/titlebackground.png", // this is 1920x1080 and uses up about 4MB - if RAM is an issue, comment out this line and set background.use_parallax_background_titlescreen = false
        "map/cinematic.png",
        "sprite/particles.png",
        "map/msgbox.png",
        "map/entities.png",
        "buildmenu.png",
        "sprite/unit1.png",
        "sprite/unit2.png",
        "sprite/unit3.png",
        "sprite/unit4.png"
      ]
    };
      
  });