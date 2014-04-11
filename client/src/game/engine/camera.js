angular.module('game.engine.camera', [])
  
  .factory('camera', function () {

    return {
      // tween me, baby!
      cameraTween: null,

      move: function moveCamera(px, py) {
        if (!viewport)
          return;

        // sanity check - don't go too far off screen
        if (px < (-jaws.width / 3))
          px = (-jaws.width / 3);
        if (py < (-jaws.height / 3))
          py = (-jaws.height / 3);
        if (px > viewport_max_x + (jaws.width / 3))
          px = viewport_max_x + (jaws.width / 3);
        if (py > viewport_max_y + (jaws.height / 3))
          py = viewport_max_y + (jaws.height / 3);

        var gotoX = (px - jaws.width / 2) | 0;
        var gotoY = (py - jaws.height / 2) | 0;

        // instant: works!
        //viewport.x = gotoX;
        //viewport.y = gotoY;

        var position = {
          x : viewport.x,
          y : viewport.y
        };
        var target = {
          x : gotoX,
          y : gotoY
        };

        //if (!cameraTween) {

        // create a new tween object - GC warning - can we avoid this? fixme todo
        cameraTween = new tween.Tween(position).to(target, 1000);

        //cameraTween.easing(TWEEN.Easing.Linear.None); // lame works


        // only bounce on the destination - like my early demos - works with the above 4000ms
        //cameraTween.easing(TWEEN.Easing.Elastic.Out); // too bouncy!

        cameraTween.easing(tween.Easing.Quadratic.InOut); // wp8 was TWEEN

        //cameraTween.easing(TWEEN.Easing.Elastic.InOut); // too bouncy!

        // define an anonymous function within it
        cameraTween.onUpdate(
          function () {
          //if (debugmode) log('Tween onUpdate...');
          viewport.x = position.x;
          viewport.y = position.y;
        });

        cameraTween.onComplete(
          function () {
          if (debugmode)
            log('Tween completed!');
          //nme.tweener.to(newtarget);
        });

        cameraTween.start();
        //}

      }

      /*
      // interesting algorithm to grab any value independent of timers etc
      function getTweenedValue(startVal, endVal, currentTime, totalTime, tweener) {
      var delta = endVal - startVal;
      var percentComplete = currentTime/totalTime;
      tweener ||= TWEEN.Easing.Linear.EaseNone;
      return tweener(percentComplete) * delta + startVal
      }
      var val = getTweenedValue(0,300,1000,2000);
       */
    };
  });