(function() {
  var map;
  map = new Map({
    gold_minimum: 80
  });
  map.parse_text(["XF...............E............|", "XM..----..@......|......------|", "X|BB..@.BBBB.@.--|---@XX..@...|", "X|----|.BBBBBBB.....BB|...@...|", "X|....|...............|....@..|", "X|....@..@|B|........M|@.....B|", "X|----|.BBBB|BB.....BB|BBBBBBB|", "X|....|.....|.--------|......M|", "X|....@..@|B|.|..............B|", "X|----|.BBBB|BBBBBBBBB|.......|", "X|....|.....|.........|.......|", "X|....@..@|B||P......M|.......|", "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"]);
  game.levels['0'] = map;
}).call(this);