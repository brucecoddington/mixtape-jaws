angular.module('game.engine.camera', [
  'game.ui.viewport'
])
  
.factory('camera', function ($log, viewport) {

  var camera = {
    // tween me, baby!
    cameraTween: null,

    move: function move(px, py) {
      if (!viewport.instance) {
        return;
      }

      // sanity check - don't go too far off screen
      if (px < (-jaws.width / 3)) {
        px = (-jaws.width / 3);
      }
        
      if (py < (-jaws.height / 3)) {
        py = (-jaws.height / 3);
      }
        
      if (px > viewport.max_x + (jaws.width / 3)) {
        px = viewport.max_x + (jaws.width / 3);
      }
        
      if (py > viewport.max_y + (jaws.height / 3)) {
        py = viewport.max_y + (jaws.height / 3);
      }

      var gotoX = (px - jaws.width / 2) | 0;
      var gotoY = (py - jaws.height / 2) | 0;

      var position = {
        x : viewport.instance.x,
        y : viewport.instance.y
      };

      var target = {
        x : gotoX,
        y : gotoY
      };

      // create a new tween object - GC warning - can we avoid this? fixme todo
      camera.cameraTween = new tween.Tween(position).to(target, 1000);
      camera.cameraTween.easing(tween.Easing.Quadratic.InOut);

      // define an anonymous function within it
      camera.cameraTween.onUpdate(function () {
        viewport.instance.x = position.x;
        viewport.instance.y = position.y;
      });

      camera.cameraTween.onComplete(function () {
        $log.debug('Tween completed!');
      });

      camera.cameraTween.start();
    }
  };

  return camera;
});