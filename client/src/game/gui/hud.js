angular.module('game.gui.hud', [])
  .factory('waveGui', function () {
    var wave = {
      instance: {}, // displays game time on the top left
      label: 'Wave:',
      x: 16,
      y: 16,
      spacing: 32, //12, // larger to make room for the " of "
      digits: 2, // 9 of 9 is the max
      digits_offset: 127
    };
    return wave;
  })

  .factory('goldGui', function () {
    var gold = {
      instance: {}, // displays player.gold in the top middle
      label: 'Gold:', // "Gold:"
      displayed_gold: 0, // we animate the score GUI just for fun
      x: 16,
      y: waveGui.y + 32 + 8,
      spacing: 12,
      digits: 3,
      digits_offset: 150
    };
    return gold;
  })

  .factory('healthGui', function () {
    var health = {
      instance: {}, // displays number of pickups left on the top right
      label: 'Health:', // "Health:"
      x: 16,
      y: goldGui.y + 32 + 8,
      spacing: 12,
      digits: 2,
      digits_offset: 160
    };
    return health;
  })

  // HUD (heads-up-display) of changing stats: Wave, Health and Gold
  .factory('hud', function ($document, profiler) {

    var hud = {

      /**
       * draws the in-game HUD (head-up-display) GUI (score, etc.)
       */
      render: function renderGUI() {

        if (!gui.gui_enabled) {
          return;
        }

        profiler.start('renderGUI');

        if (goldGui.instance) {
          goldGui.instance.draw();
        }
          
        if (waveGui.instance) {
          waveGui.instance.draw();
        }
          
        if (healthGui.instance) {
          healthGui.instance.draw();
        }

        // update FPS gui once a second max so it doesn't affect fps too much
        if (hud.info_tag && hud.info_tag.length > 0) {
          timer.fps_framecount++;

          if (timer.currentFrameTimestamp > (timer.fps_prev_timestamp + 1000)) {
            timer.fps_prev_timestamp = timer.currentFrameTimestamp;
            timer.fps_prev_framecount = timer.fps_framecount;
            timer.fps_framecount = 0;

            var profilestring = '';
            if (debugmode) {
              for (var pname in profiler.length) {
                profilestring += '<br>' + pname + ':' + profiler.length[pname] + 'ms (max:' + profile_maxlen[pname] + 'ms)';
              }
              profilestring += '<br>simstepsrequired: ' + simstepsrequired;
              profilestring += '<br>unsimulatedms: ' + unsimulatedms;
              profilestring += '<br>currentframems: ' + currentframems;
              profilestring += '<br>last touched sprite: ' + debugTouchInfo;
              info_tag.innerHTML = "FPS: " + timer.fps_prev_framecount + profilestring +
                '<br>timer.currentFrameTimestamp: ' + timer.currentFrameTimestamp;
            }

          } else {
            hud.info_tag = angular.element("#info");
          }
        }

        profiler.end('renderGUI');
      }
    };

    return hud;
  });
  




