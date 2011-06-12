(function() {
  var Dispatcher, Game, LevelInterface, Monster, Player;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Game = (function() {
    function Game() {
      this._map_loaded = __bind(this._map_loaded, this);      this.levels = {};
    }
    Game.prototype.load_level = function(name) {
      return this.load_map(name, this._map_loaded);
    };
    Game.prototype._map_loaded = function(map) {
      var item, monster, obj, _i, _j, _len, _len2, _ref, _ref2, _results;
      item = map.get_player();
      this.interface = new LevelInterface(map);
      this.dispatcher = new Dispatcher(this.interface, this);
      this.player = new Player(map, item);
      this.dispatcher.add(this.player);
      this.monsters = [];
      _ref = map.get_mosters();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj.is_monster) {
          monster = new Monster(map, obj, this.player);
          this.monsters.push(monster);
          this.dispatcher.add(monster);
        }
      }
      _ref2 = map.get_objects();
      _results = [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        obj = _ref2[_j];
        _results.push(this.interface.add(obj));
      }
      return _results;
    };
    Game.prototype.load_map = function(name, fun) {
      return fun(this.levels[name]);
    };
    Game.prototype.start = function() {
      return this.dispatcher.start();
    };
    Game.prototype.stop = function() {
      return this.dispatcher.stop();
    };
    return Game;
  })();
  LevelInterface = (function() {
    function LevelInterface(map) {
      this.map = map;
      this.container = $('#game');
      this.container.css({
        width: this.map.width * 32 + 'px',
        height: this.map.height * 32 + 'px'
      });
      this.level = $('<div id="level">');
      this.mapdiv = $('<div id="map">');
      this.level.append(this.mapdiv);
      this.container.append(this.level);
    }
    LevelInterface.prototype.add = function(obj) {
      return this.mapdiv.append(obj.get_html());
    };
    LevelInterface.prototype.update = function(map) {};
    return LevelInterface;
  })();
  Player = (function() {
    function Player(map, item) {
      this.map = map;
      this.freeze_done = __bind(this.freeze_done, this);
      this.dig_done = __bind(this.dig_done, this);
      this.move_done = __bind(this.move_done, this);
      this.check_keys = __bind(this.check_keys, this);
      this.left = false;
      this.item = item;
      this.item.controller = this;
      this.x = this.item.x;
      this.y = this.item.y;
      this.score = 0;
    }
    Player.prototype.start = function(disp) {
      this.dispatcher = disp;
      return this.tickfunc = this.check_keys;
    };
    Player.prototype.add_bonus = function(value) {
      this.score += value;
      $("#score").text(this.score);
      return $("#dead").text("MOAR!MOAR!MOAR");
    };
    Player.prototype.kill = function() {
      $("#dead").text("NNNNNNNNNNOOOOOOOOOOOOOO!!!!!");
      return this.dispatcher.remove(this);
    };
    Player.prototype.tick = function() {
      if (this.map.unsolved) {
        if (this.score >= this.map.gold_minimum && this.map.unsolved) {
          this.map.flag = this.map.replace(this.map.flag, MapFlagged);
          this.map.unsolved = false;
        }
      } else {
        if (this.map.flag.x === this.x && this.map.flag.y === this.y) {
          $("#dead").text("You Win!");
          this.dispatcher.objects = [];
          return;
        }
      }
      return this.tickfunc();
    };
    Player.prototype.check_keys = function() {
      var d, m, x, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      if (this.dispatcher.key('37')) {
        if (this.map.get_bg(this.x, this.y).freeze && ((_ref = this.map.get_bg(this.x - 1, this.y - 1)) != null ? _ref.movable : void 0)) {
          this.left = true;
          this.move(this.x - 1, this.y - 1, 'moveleftup');
          return;
        }
        if (((_ref2 = this.map.get_bg(this.x - 1, this.y)) != null ? _ref2.movable : void 0) && !this.map.get_fg(this.x - 1, this.y)) {
          this.left = true;
          this.move(this.x - 1, this.y, 'moveleft');
          return;
        }
      }
      if (this.dispatcher.key('39')) {
        if (this.map.get_bg(this.x, this.y).freeze && ((_ref3 = this.map.get_bg(this.x + 1, this.y - 1)) != null ? _ref3.movable : void 0)) {
          this.left = false;
          this.move(this.x + 1, this.y - 1, 'moverightup');
          return;
        }
        if (((_ref4 = this.map.get_bg(this.x + 1, this.y)) != null ? _ref4.movable : void 0) && !this.map.get_fg(this.x + 1, this.y)) {
          this.left = false;
          this.move(this.x + 1, this.y, 'moveleft');
          return;
        }
      }
      if (this.dispatcher.key('38')) {
        if (this.map.get_bg(this.x, this.y).flyable && ((_ref5 = this.map.get_bg(this.x, this.y - 1)) != null ? _ref5.movable : void 0)) {
          this.move(this.x, this.y - 1, 'fly');
          return;
        }
      }
      if (this.dispatcher.key('40')) {
        m = (_ref6 = this.map.get_bg(this.x, this.y + 1)) != null ? _ref6.movable : void 0;
        if (m) {
          this.move(this.x, this.y + 1, 'movedown');
          return;
        }
      }
      if (this.dispatcher.key('32')) {
        if (this.left) {
          x = this.x - 1;
        } else {
          x = this.x + 1;
        }
        m = (_ref7 = this.map.get_bg(x, this.y)) != null ? _ref7.movable : void 0;
        d = (_ref8 = this.map.get_bg(x, this.y + 1)) != null ? _ref8.diggable : void 0;
        if (d && m) {
          this.tickfunc = (__bind(function() {
            return this.dig_done(x, this.y + 1);
          }, this));
          return;
        }
      }
      return this.tickfunc = this.check_keys;
    };
    Player.prototype.move = function(tox, toy, animation) {
      var scale;
      this.item.animate(tox, toy);
      scale = this.left ? 'scale(-1, 1)' : 'scale(1, 1)';
      this.item.html.css({
        '-moz-transform': scale,
        '-webkit-transform': scale
      });
      return this.tickfunc = (__bind(function() {
        return this.move_done(tox, toy);
      }, this));
    };
    Player.prototype.move_done = function(x, y) {
      var fall, fly, freeze, monster, _base, _ref;
      this.x = x;
      this.y = y;
      this.item.set_position(this.x, this.y);
      if (this.map.get_bg(this.x, this.y).hangable) {
        this.check_keys();
        return;
      }
      if (typeof (_base = this.map.get_bg(this.x, this.y)).pick_up === "function") {
        _base.pick_up(this, this.map);
      }
      if (this.map.get_bg(this.x, this.y + 1)) {
        fall = this.map.get_bg(this.x, this.y).fallable;
        fly = this.map.get_bg(this.x, this.y + 1).flyable;
        monster = this.map.get_fg(this.x, this.y + 1);
        if (fall && !fly && !monster) {
          this.move(this.x, this.y + 1, 'falldown');
          return;
        }
      }
      freeze = (_ref = this.map.get_bg(this.x, this.y)) != null ? _ref.freeze : void 0;
      if (freeze) {
        this.tickfunc = this.freeze_done;
        return this.freezetimes = freeze;
      } else {
        return this.check_keys();
      }
    };
    Player.prototype.dig_done = function(x, y) {
      var nbrick;
      nbrick = this.map.replace(this.map.get_bg(x, y), MapDigBrick);
      this.dispatcher.add(nbrick);
      return this.tickfunc = this.check_keys;
    };
    Player.prototype.freeze_done = function() {
      this.freezetimes -= 1;
      if (!this.freezetimes) {
        return this.check_keys();
      }
    };
    return Player;
  })();
  Monster = (function() {
    Monster.prototype.frozen = false;
    Monster.prototype.has_gold = false;
    Monster.prototype.player_coord = {};
    function Monster(map, item, player) {
      this.map = map;
      this.item = item;
      this.player = player;
      this.freeze_done = __bind(this.freeze_done, this);
      this.move_done = __bind(this.move_done, this);
      this.item.controller = this;
      this.weight = 5 + Math.round(Math.random() * 21);
    }
    Monster.prototype.start = function(disp) {
      return this.dispatcher = disp;
    };
    Monster.prototype.tick = function() {
      if (this.freezetimes) {
        this.freeze_done();
        return false;
      }
      if (this.tox && this.toy) {
        this.move_done(this.tox, this.toy);
      }
      return this.move_to();
    };
    Monster.prototype.kill = function() {
      var _ref, _ref2;
      if (this.has_gold) {
        this.map.get_bg(this.x, this.y - 1).get_back(this.map);
        this.has_gold = false;
      }
      $("#dead").text("ARRRGGHHHHHHHH");
      if ((_ref = this.map) != null ? _ref.moster_factory : void 0) {
        this.move_finish(this.map.moster_factory.x, (_ref2 = this.map) != null ? _ref2.moster_factory.y : void 0);
        this.tox = this.x;
        this.toy = this.y;
        return this.freezetimes = 5;
      } else {
        return this.dispatcher.remove(this);
      }
    };
    Monster.prototype.move_to = function() {
      var finish, item, listing, move_to, obj, objects, res, row, start, weight, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5;
      this.player_coord.x = this.player.x;
      this.player_coord.y = this.player.y;
      if (this.freezetimes > 0) {
        return false;
      }
      start = [this.item.x, this.item.y];
      finish = [this.player.x, this.player.y];
      if (this.player.freezetimes) {
        finish[1] -= 1;
      }
      weight = 1;
      listing = {
        arr: [],
        has: function() {
          return this.arr;
        },
        get: function() {
          var arr;
          arr = this.arr;
          this.arr = [];
          return arr;
        },
        add: function(list) {
          return this.arr.push(list);
        }
      };
      listing.add(start);
      objects = this.map.object_static;
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        row = objects[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          obj = row[_j];
          obj.set_weight(256);
        }
      }
      if ((_ref = objects[start[1]][start[0]]) != null) {
        _ref.set_weight(255);
      }
      while (listing.has().length) {
        _ref2 = listing.get();
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          item = _ref2[_k];
          _ref3 = ['left', 'right', 'up', 'down'];
          for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
            move_to = _ref3[_l];
            res = this.check_path(item[0], item[1], move_to, objects);
            if (res) {
              if (res[0] === finish[0] && res[1] === finish[1]) {
                if (!this.return_path(objects, res[0], res[1], start)) {
                  this.x = -1;
                  this.y = -1;
                }
                return;
              }
              if (((_ref4 = objects[res[1]][res[0]]) != null ? _ref4.weight : void 0) === 256) {
                listing.add(res);
                if ((_ref5 = objects[res[1]][res[0]]) != null) {
                  _ref5.set_weight(weight);
                }
              }
            }
          }
        }
        weight += 1;
        if (weight > this.weight) {
          this.return_path(objects, item[0], item[1], start);
          return;
        }
      }
      return false;
    };
    Monster.prototype.return_path = function(objects, x, y, start) {
      var action, item, res, value, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5;
      action = '';
      value = 4000;
      while (true) {
        res = [];
        res.push([(_ref = objects[y - 1][x]) != null ? _ref.weight : void 0, x, y - 1, 'movedown']);
        res.push([(_ref2 = objects[y + 1][x]) != null ? _ref2.weight : void 0, x, y + 1, 'moveup']);
        res.push([(_ref3 = objects[y][x - 1]) != null ? _ref3.weight : void 0, x - 1, y, 'moveright']);
        res.push([(_ref4 = objects[y][x + 1]) != null ? _ref4.weight : void 0, x + 1, y, 'moveleft']);
        for (_i = 0, _len = res.length; _i < _len; _i++) {
          item = res[_i];
          if ((_ref5 = this.map.get_bg(this.x, this.y)) != null ? _ref5.freeze : void 0) {
            if ((x - 1 === start[0] && y + 1 === start[1]) || (x + 1 === start[0] && y + 1 === start[1])) {
              this.move(x, y, item[3]);
              return true;
            }
          }
          if (value === 4000 && item[1] === start[0] && item[2] === start[1]) {
            this.move(x, y, item[3]);
            return true;
          }
        }
        for (_j = 0, _len2 = res.length; _j < _len2; _j++) {
          item = res[_j];
          if (item[0] === 255) {
            this.move(x, y, action);
            return true;
          }
          if (item[0] < value) {
            value = item[0];
            x = item[1];
            y = item[2];
            action = item[3];
          }
        }
      }
      return false;
    };
    Monster.prototype.check_path = function(x, y, to, objects) {
      var _ref, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref21, _ref22, _ref23, _ref24, _ref25, _ref26, _ref27, _ref28, _ref29, _ref3, _ref30, _ref31, _ref32, _ref33, _ref34, _ref35, _ref36, _ref37, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      if ((_ref = this.map.get_bg(this.x, this.y)) != null ? _ref.freeze : void 0) {
        if (to === 'left') {
          return [x - 1, y - 1];
        }
        if (to === 'right') {
          return [x + 1, y - 1];
        }
      }
      if (to === 'down') {
        if (!((_ref2 = objects[y + 1]) != null ? _ref2[x].movable : void 0)) {
          return false;
        } else {
          return [x, y + 1];
        }
        if (((_ref3 = objects[y][x]) != null ? _ref3.hangable : void 0) && ((_ref4 = objects[y + 1]) != null ? (_ref5 = _ref4[x]) != null ? _ref5.movable : void 0 : void 0)) {
          return [x, y + 1];
        }
        if (((_ref6 = objects[y + 1]) != null ? (_ref7 = _ref6[x]) != null ? _ref7.flyable : void 0 : void 0) || ((_ref8 = objects[y + 1]) != null ? (_ref9 = _ref8[x]) != null ? _ref9.freeze : void 0 : void 0)) {
          return [x, y + 1];
        }
        if (((_ref10 = objects[y + 1]) != null ? (_ref11 = _ref10[x]) != null ? _ref11.fallable : void 0 : void 0) || !((_ref12 = objects[y + 1]) != null ? (_ref13 = _ref12[x]) != null ? _ref13.freeze : void 0 : void 0)) {
          return [x, y + 1];
        }
      }
      if (to === 'up') {
        if (((_ref14 = objects[y - 1]) != null ? (_ref15 = _ref14[x]) != null ? _ref15.movable : void 0 : void 0) && ((_ref16 = objects[y][x]) != null ? _ref16.flyable : void 0)) {
          return [x, y - 1];
        }
      }
      if (to === 'left') {
        if (!((_ref17 = objects[y]) != null ? (_ref18 = _ref17[x - 1]) != null ? _ref18.movable : void 0 : void 0)) {
          return false;
        }
        if (objects[y][x].fallable && !((_ref19 = objects[y + 1]) != null ? (_ref20 = _ref19[x]) != null ? _ref20.flyable : void 0 : void 0) && !((_ref21 = objects[y + 1]) != null ? (_ref22 = _ref21[x]) != null ? _ref22.freeze : void 0 : void 0)) {
          return false;
        }
        if ((_ref23 = objects[y][x - 1]) != null ? _ref23.movable : void 0) {
          return [x - 1, y];
        }
        if (!((_ref24 = objects[y + 1]) != null ? (_ref25 = _ref24[x - 1]) != null ? _ref25.flyable : void 0 : void 0) || ((_ref26 = objects[y + 1]) != null ? (_ref27 = _ref26[x - 1]) != null ? _ref27.freeze : void 0 : void 0) || ((_ref28 = this.map.get_fg(y + 1, x - 1)) != null ? _ref28.is_monster : void 0)) {
          return [x - 1, y];
        }
      }
      if (to === 'right') {
        if ((((_ref29 = objects[y]) != null ? (_ref30 = _ref29[x]) != null ? _ref30.fallable : void 0 : void 0) && !((_ref31 = objects[y + 1]) != null ? (_ref32 = _ref31[x]) != null ? _ref32.flyable : void 0 : void 0)) || ((_ref33 = objects[y + 1]) != null ? (_ref34 = _ref33[x - 1]) != null ? _ref34.freeze : void 0 : void 0) || ((_ref35 = this.map.get_fg(y + 1, x + 1)) != null ? _ref35.is_monster : void 0)) {
          return false;
        }
        if ((_ref36 = objects[y]) != null ? (_ref37 = _ref36[x + 1]) != null ? _ref37.movable : void 0 : void 0) {
          return [x + 1, y];
        }
      }
      return false;
    };
    Monster.prototype.move = function(tox, toy, animation) {
      var obj, _i, _len, _ref, _ref2;
      _ref = this.dispatcher.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (((obj != null ? (_ref2 = obj.item) != null ? _ref2.is_monster : void 0 : void 0) && (obj != null ? obj.tox : void 0) === tox && (obj != null ? obj.toy : void 0) === toy) && !obj.freezetimes) {
          return;
        }
      }
      this.tox = tox;
      this.toy = toy;
      this.action = animation;
      this.item.transform(this.action);
      return this.item.animate(this.tox, this.toy);
    };
    Monster.prototype.move_done = function(x, y) {
      var freeze, _base, _ref;
      this.x = x;
      this.y = y;
      this.move_finish(this.x, this.y);
      if (this.player.x === this.x && this.player.y === this.y) {
        this.player.kill();
        this.dispatcher.remove(this.player);
        return;
      }
      if (this.has_gold === false) {
        if (typeof (_base = this.map.get_bg(this.x, this.y)).pick_up === "function") {
          _base.pick_up(this, this.map);
        }
      }
      if (this.map.get_bg(this.x, this.y).hangable) {
        return;
      }
      if ((_ref = this.map.get_fg(this.x, this.y + 1)) != null ? _ref.is_monster : void 0) {
        return;
      }
      freeze = this.map.get_bg(this.x, this.y + 1).freeze;
      if (freeze) {
        this.move_finish(this.x, this.y + 1);
        this.freezetimes = freeze;
        return;
      }
      if (this.map.get_bg(this.x, this.y).fallable && !this.map.get_bg(this.x, this.y + 1).flyable) {
        this.move(this.x, this.y + 1, 'falldown');
      }
    };
    Monster.prototype.kill_player = function() {
      this.player.kill();
      this.dispatcher.remove(this.player);
    };
    Monster.prototype.move_finish = function(x, y) {
      var _ref, _ref2, _ref3, _ref4;
      this.x = x;
      this.y = y;
      this.item.set_position(this.x, this.y);
      if (this.player_coord) {
        if (this.player.y === this.y && ((this.player_coord.x <= (_ref = this.x) && _ref <= this.player.x) || (this.player_coord.x >= (_ref2 = this.x) && _ref2 >= this.player.x))) {
          this.kill_player();
          return;
        }
        if (this.player.x === this.x && ((this.player_coord.y <= (_ref3 = this.y) && _ref3 <= this.player.y) || (this.player_coord.y >= (_ref4 = this.y) && _ref4 >= this.player.y))) {
          this.kill_player();
        }
      }
    };
    Monster.prototype.add_bonus = function(bonus) {
      return this.has_gold = true;
    };
    Monster.prototype.freeze_done = function() {
      return this.freezetimes -= 1;
    };
    return Monster;
  })();
  Dispatcher = (function() {
    function Dispatcher(face, game) {
      this.face = face;
      this.game = game;
      this.tick = __bind(this.tick, this);
      this.key_up = __bind(this.key_up, this);
      this.key_down = __bind(this.key_down, this);
      this.queue = [];
      this.objects = [];
      this.keys = {};
      this.started = false;
    }
    Dispatcher.prototype.add = function(obj) {
      this.objects.push(obj);
      if (this.started) {
        return obj.start(this);
      }
    };
    Dispatcher.prototype.remove = function(obj) {
      return this.objects.splice(this.objects.indexOf(obj), 1);
    };
    Dispatcher.prototype.start = function() {
      var i, _i, _len, _ref;
      this._interval = setInterval(this.tick, window.game.speed);
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        i.start(this);
      }
      this.started = true;
      $(document).keydown(this.key_down);
      return $(document).keyup(this.key_up);
    };
    Dispatcher.prototype.stop = function() {
      clearInterval(this._interval);
      $(document).unbind('keydown', this.key_down);
      return $(document).unbind('keyup', this.key_up);
    };
    Dispatcher.prototype.key = function(code) {
      return this.keys[code];
    };
    Dispatcher.prototype.key_down = function(event) {
      var code;
      code = event.keyCode;
      if (event.shiftKey) {
        code = 's' + code;
      }
      if (event.ctrlKey) {
        code = 'c' + code;
      }
      if (event.altKey) {
        code = 'a' + code;
      }
      return this.keys[code] = 1;
    };
    Dispatcher.prototype.key_up = function(event) {
      var code;
      code = event.keyCode;
      if (event.shiftKey) {
        code = 's' + code;
      }
      if (event.ctrlKey) {
        code = 'c' + code;
      }
      if (event.altKey) {
        code = 'a' + code;
      }
      return this.keys[code] = -1;
    };
    Dispatcher.prototype.tick = function() {
      var i, k, v, _i, _len, _ref, _ref2;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        i.tick();
      }
      _ref2 = this.keys;
      for (k in _ref2) {
        v = _ref2[k];
        if (v < 0) {
          delete this.keys[k];
        }
      }
      return this.face.update();
    };
    return Dispatcher;
  })();
  window.game = new Game();
  window.game.speed = 400;
  $(document).ready(function() {
    window.game.load_level('0');
    return window.game.start();
  });
}).call(this);
