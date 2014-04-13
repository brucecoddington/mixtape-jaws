var tween = window.TWEEN; // handy for animation interpolation

angular.module('main', [
  'templates-main',
  'game.container'
])

.config(function ($logProvider) {
  $logProvider.debugEnabled(false);
})

.run(function ($log, $rootScope, game) {
  // All initializations are run once this event fires
  // which occurs after the html page has loaded.
  jaws.onload = game.init;

  $log.info("Game started.");
});
