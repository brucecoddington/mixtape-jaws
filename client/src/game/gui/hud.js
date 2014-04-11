angular.module('game.gui.hud', [])
  .value('waveGui', {
    // HUD (heads-up-display) of changing stats: Wave, Health and Gold
    WaveGUI: {}, // displays game time on the top left
    WaveGUIlabel: 'Wave:',
    wave_gui_x: 16,
    wave_gui_y: 16,
    wave_gui_spacing: 32, //12, // larger to make room for the " of "
    wave_gui_digits: 2, // 9 of 9 is the max
    wave_gui_digits_offset: 127,
  })

  .value('goldGui', {
    GoldGUI: {}, // displays player_Gold in the top middle
    GoldGUIlabel: 'Gold:', // "Gold:"
    displayedGold: 0, // we animate the score GUI just for fun
    gold_gui_x: 16,
    gold_gui_y: wave_gui_y + 32 + 8,
    gold_gui_spacing: 12,
    gold_gui_digits: 3,
    gold_gui_digits_offset: 150,
  })

  .value('healthGui', {
    HealthGUI: {}, // displays number of pickups left on the top right
    HealthGUIlabel: 'Health:', // "Health:"
    health_gui_x: 16,
    health_gui_y: gold_gui_y + 32 + 8,
    health_gui_spacing: 12,
    health_gui_digits: 2,
    health_gui_digits_offset: 160,
  })

  .factory('hud', function () {

    return {
      /**
       * draws the in-game HUD (head-up-display) GUI (score, etc.)
       */
      render: function renderGUI() {

        if (!gui_enabled)
          return;

        profile_start('renderGUI');

        if (GoldGUI)
          GoldGUI.draw();
        if (WaveGUI)
          WaveGUI.draw();
        if (HealthGUI)
          HealthGUI.draw();

        // update FPS gui once a second max so it doesn't affect fps too much
        if (info_tag) {
          fps_framecount++;
          if (currentFrameTimestamp > (fps_prev_timestamp + 1000)) {
            fps_prev_timestamp = currentFrameTimestamp;
            fps_prev_framecount = fps_framecount;
            fps_framecount = 0;

            var profilestring = '';
            if (debugmode) {
              for (var pname in profile_length) {
                profilestring += '<br>' + pname + ':' + profile_length[pname] + 'ms (max:' + profile_maxlen[pname] + 'ms)';
              }
              profilestring += '<br>simstepsrequired: ' + simstepsrequired;
              profilestring += '<br>unsimulatedms: ' + unsimulatedms;
              profilestring += '<br>currentframems: ' + currentframems;
              profilestring += '<br>last touched sprite: ' + debugTouchInfo;
              info_tag.innerHTML = "FPS: " + fps_prev_framecount + profilestring +
                '<br>currentFrameTimestamp: ' + currentFrameTimestamp;
            }
          }
        }

        profile_end('renderGUI');

      } // renderGUI function
    };
  });
  




