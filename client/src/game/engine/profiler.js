angular.module('game.engine.profiler', [])
  
  .factory('profiler', function () {

    return {
      /**
       * Records the current timestamp for a named event for benchmarking.
       * Call profile_end using the same event name to store the elapsed time
       * Only used when debugging to find areas of poor performance.
       */
      start: function profile_start(name) {
        if (!debugmode)
          return;
        profile_starts[name] = new Date().valueOf();
      },

      /**
       * Records the end timestamp for a named event for benchmarking.
       * Call profile_start using the same event name to begin
       */
      end: function profile_end(name) {
        if (!debugmode)
          return;
        profile_length[name] = new Date().valueOf() - profile_starts[name];
        if (!profile_maxlen[name] || (profile_maxlen[name] < profile_length[name]))
          profile_maxlen[name] = profile_length[name];
        //spammy if (debugmode) log(name + ' took ' + profile_length[name] + 'ms');
      }
    };
  });