angular.module('game.engine.profiler', [])
  
.factory('profiler', function ($logProvider) {

  var profiler = {
    starts: [], // for debug only: performance PROFILER
    length: [], // time how long things take to find performance bottlenecks
    maxlen: [], // this is only done if we are in debugmode
    
    /**
     * Records the current timestamp for a named event for benchmarking.
     * Call profiler.end using the same event name to store the elapsed time
     * Only used when debugging to find areas of poor performance.
     */
    start: function start(name) {
      if (!$logProvider.debugEnabled) {
        return;
      }

      profiler.starts[name] = new Date().valueOf();
    },

    /**
     * Records the end timestamp for a named event for benchmarking.
     * Call profiler.start using the same event name to begin
     */
    end: function end(name) {
      if (!$logProvider.debugEnabled) {
        return;
      }

      profiler.length[name] = new Date().valueOf() - profiler.starts[name];

      if (!profiler.maxlen[name] || (profiler.maxlen[name] < profiler.length[name]))
        profiler.maxlen[name] = profiler.length[name];
    }
  };

  return profiler;
});