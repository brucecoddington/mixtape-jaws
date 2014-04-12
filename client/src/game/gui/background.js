angular.module('game.gui.background', [])
  .value('background', {
    // the backgrounds
    use_parallax_background: false, // draw the looped bg
    use_parallax_background_titlescreen: true, // draw the looped bg - works great on web, win8, and NEW wp8 phones, but this uses about 4MB RAM - see background.title_background.png
    parallax: undefined, // the scrolling background during gameplay
    title_background: undefined, // the background during titlescreen and transitions
    color: "#156c99" // blue
  });