angular.module('game.gui.background', [])
  .value('background', {
    // the backgrounds
    use_parallax_background: false, // draw the looped bg
    use_parallax_background_titlescreen: true, // draw the looped bg - works great on web, win8, and NEW wp8 phones, but this uses about 4MB RAM - see titlebackground.png
    parallax: undefined, // the scrolling background during gameplay
    titlebackground: undefined, // the background during titlescreen and transitions
    background_colour: "#156c99" // blue
  });