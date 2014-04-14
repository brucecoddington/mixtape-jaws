angular.module('game.data.levels', [
  'game.data.levels.level0',
  'game.data.levels.level1',
  'game.data.levels.level2',
  'game.data.levels.level3'
])

.factory('gameLevels', function (level0, level1, level2, level3) {
  return [level0, level1, level2, level3];
});