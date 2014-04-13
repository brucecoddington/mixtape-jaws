var tween = window.TWEEN; // handy for animation interpolation
var jaws = window.jaws; // the jawsjs canvas api
var Howl = window.Howl; // a cross-browser sound api

angular.module('main', [
  'templates-main',
  'game.container',
  'game.data',
  'game.engine',
  'game.entities',
  'game.ui',
  'game.states',
  'game.system'
])

.config(function ($logProvider) {
  $logProvider.debugEnabled = false;
})

.run(function ($log, $rootScope, game) {
  // All initializations are run once this event fires
  // which occurs after the html page has loaded.
  jaws.onload = game.init;

  $log.info("Game started.");
});
