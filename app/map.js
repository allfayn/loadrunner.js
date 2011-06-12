(function() {
  var BaseActionObject, BaseObject, Map, MapBrick, MapConcrete, MapDigBrick, MapDoor, MapEmpty, MapFlag, MapFlagged, MapGold, MapLadder, MapMonster, MapRope, MapUser;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Map = (function() {
    Map.prototype.object_static = [];
    Map.prototype.object_dynamic = [];
    function Map(properties) {
      this.gold_minimum = properties.gold_minimum;
      this.unsolved = true;
    }
    Map.prototype.parse_text = function(text) {
      var object, raw, row, x, y, _ref, _ref2;
      for (y = 0, _ref = text.length - 1; 0 <= _ref ? y <= _ref : y >= _ref; 0 <= _ref ? y++ : y--) {
        raw = text[y];
        row = [];
        for (x = 0, _ref2 = raw.length - 1; 0 <= _ref2 ? x <= _ref2 : x >= _ref2; 0 <= _ref2 ? x++ : x--) {
          object = this.parse_char(raw[x], x, y);
          if (object.active) {
            row.push(new MapEmpty);
            this.object_dynamic.push(object);
          } else {
            row.push(object);
          }
        }
        this.object_static.push(row);
      }
      this.width = row.length;
      return this.height = text.length;
    };
    Map.prototype.parse_char = function(char, x, y) {
      switch (char) {
        case "X":
          return new MapConcrete(x, y);
        case "|":
          return new MapLadder(x, y);
        case "-":
          return new MapRope(x, y);
        case "B":
          return new MapBrick(x, y);
        case ".":
          return new MapEmpty(x, y);
        case "P":
          return new MapUser(x, y);
        case "@":
          return new MapGold(x, y);
        case "M":
          return new MapMonster(x, y);
        case "F":
          this.moster_factory = new MapEmpty(x, y);
          return this.moster_factory;
        case "E":
          this.flag = new MapFlag(x, y);
          return this.flag;
        default:
          console.log("Wrong char in map:", char);
          return new MapEmpty(x, y);
      }
    };
    Map.prototype.get_player = function() {
      var i, _i, _len, _ref;
      _ref = this.object_dynamic;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (i.is_player) {
          return i;
        }
      }
    };
    Map.prototype.get_mosters = function() {
      var i, result, _i, _len, _ref;
      result = [];
      _ref = this.object_dynamic;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (i.is_monster) {
          result.push(i);
        }
      }
      return result;
    };
    Map.prototype.get_fg = function(x, y) {
      var obj, _i, _len, _ref;
      _ref = this.object_dynamic;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj.x === x && obj.y === y) {
          return obj;
        }
      }
      return false;
    };
    Map.prototype.get_bg = function(x, y) {
      var _ref;
      return (_ref = this.object_static[y]) != null ? _ref[x] : void 0;
    };
    Map.prototype.get_objects = function() {
      var res, row, _i, _len, _ref;
      res = [];
      res = res.concat(this.object_dynamic);
      _ref = this.object_static;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        res = res.concat(row);
      }
      return res;
    };
    Map.prototype.replace = function(old, typ) {
      var block, parent;
      parent = old.html.parent();
      old.html.remove();
      block = new typ(old.x, old.y);
      this.object_static[old.y][old.x] = block;
      parent.append(block.get_html());
      return block;
    };
    return Map;
  })();
  BaseObject = (function() {
    BaseObject.prototype.movable = false;
    BaseObject.prototype.fallable = false;
    BaseObject.prototype.flyable = false;
    BaseObject.prototype.freeze = 0;
    BaseObject.prototype.hangable = false;
    BaseObject.prototype.active = false;
    BaseObject.prototype.css_class = 'object';
    BaseObject.prototype.css_size = 32;
    BaseObject.prototype.css_symbol = '';
    BaseObject.prototype.weight = 256;
    function BaseObject(x, y) {
      this.x = x;
      this.y = y;
    }
    BaseObject.prototype.set_weight = function(weight) {
      this.weight = weight;
    };
    BaseObject.prototype.get_html = function() {
      this.html = $('<div>').text(this.css_symbol).addClass(this.css_class);
      this.set_position(this.x, this.y);
      return this.html;
    };
    BaseObject.prototype.set_position = function(x, y) {
      this.x = x;
      this.y = y;
      return this.html.stop(true, true).css({
        top: this.y * this.css_size + 'px',
        left: this.x * this.css_size + 'px'
      });
    };
    BaseObject.prototype.animate = function(x, y, speed) {
      speed = speed || window.game.speed;
      return this.html.stop().animate({
        top: y * this.css_size + 'px',
        left: x * this.css_size + 'px'
      }, speed, 'linear');
    };
    return BaseObject;
  })();
  BaseActionObject = (function() {
    __extends(BaseActionObject, BaseObject);
    function BaseActionObject() {
      BaseActionObject.__super__.constructor.apply(this, arguments);
    }
    BaseActionObject.prototype.active = true;
    return BaseActionObject;
  })();
  MapBrick = (function() {
    __extends(MapBrick, BaseObject);
    function MapBrick() {
      MapBrick.__super__.constructor.apply(this, arguments);
    }
    MapBrick.prototype.css_class = 'object-brick';
    MapBrick.prototype.css_symbol = '▒';
    MapBrick.prototype.flyable = true;
    MapBrick.prototype.diggable = true;
    return MapBrick;
  })();
  MapDigBrick = (function() {
    __extends(MapDigBrick, BaseObject);
    function MapDigBrick() {
      MapDigBrick.__super__.constructor.apply(this, arguments);
    }
    MapDigBrick.prototype.fallable = true;
    MapDigBrick.prototype.freeze = 5;
    MapDigBrick.prototype.digtime = 10;
    MapDigBrick.prototype.css_class = 'object-digbrick';
    MapDigBrick.prototype.css_symbol = '░';
    MapDigBrick.prototype.start = function(dispatcher) {
      this.dispatcher = dispatcher;
      return this.cur_freeze = this.digtime;
    };
    MapDigBrick.prototype.tick = function() {
      var map, pl;
      this.cur_freeze -= 1;
      if (!this.cur_freeze) {
        this.dispatcher.remove(this);
        map = this.dispatcher.face.map;
        map.replace(this, MapBrick);
        pl = map.get_fg(this.x, this.y);
        if (pl) {
          return pl != null ? pl.controller.kill() : void 0;
        }
      }
    };
    return MapDigBrick;
  })();
  MapUser = (function() {
    __extends(MapUser, BaseActionObject);
    function MapUser() {
      MapUser.__super__.constructor.apply(this, arguments);
    }
    MapUser.prototype.is_player = true;
    MapUser.prototype.css_class = 'object-user';
    MapUser.prototype.css_symbol = '♿';
    return MapUser;
  })();
  MapMonster = (function() {
    __extends(MapMonster, BaseActionObject);
    function MapMonster() {
      MapMonster.__super__.constructor.apply(this, arguments);
    }
    MapMonster.prototype.css_class = 'object-monster';
    MapMonster.prototype.css_symbol = '♿';
    MapMonster.prototype.is_monster = true;
    MapMonster.prototype.transform = function(action) {
      var scale;
      switch (action) {
        case "moveleft":
          scale = 'scale(-1, 1)';
          return this.html.css({
            '-moz-transform': scale,
            '-webkit-transform': scale
          });
        case "moveright":
          scale = 'scale(1, 1)';
          return this.html.css({
            '-moz-transform': scale,
            '-webkit-transform': scale
          });
        case "movelefttern":
          scale = 'scale(-1,-1)';
          return this.html.css({
            '-moz-transform': scale,
            '-webkit-transform': scale
          });
        case "moverighttern":
          scale = 'scale(1, -1)';
          return this.html.css({
            '-moz-transform': scale,
            '-webkit-transform': scale
          });
      }
    };
    return MapMonster;
  })();
  MapEmpty = (function() {
    __extends(MapEmpty, BaseObject);
    function MapEmpty() {
      MapEmpty.__super__.constructor.apply(this, arguments);
    }
    MapEmpty.prototype.fallable = true;
    MapEmpty.prototype.movable = true;
    MapEmpty.prototype.css_class = 'object-empty';
    MapEmpty.prototype.css_symbol = '';
    MapEmpty.prototype.get_back = function(map) {
      return map.replace(this, MapGold);
    };
    return MapEmpty;
  })();
  MapFlag = (function() {
    __extends(MapFlag, MapEmpty);
    function MapFlag() {
      MapFlag.__super__.constructor.apply(this, arguments);
    }
    return MapFlag;
  })();
  MapFlagged = (function() {
    __extends(MapFlagged, MapFlag);
    function MapFlagged() {
      MapFlagged.__super__.constructor.apply(this, arguments);
    }
    MapFlagged.prototype.css_class = 'object-door';
    MapFlagged.prototype.css_symbol = '⚐';
    return MapFlagged;
  })();
  MapLadder = (function() {
    __extends(MapLadder, BaseObject);
    function MapLadder() {
      MapLadder.__super__.constructor.apply(this, arguments);
    }
    MapLadder.prototype.hangable = true;
    MapLadder.prototype.flyable = true;
    MapLadder.prototype.movable = true;
    MapLadder.prototype.css_class = 'object-ladder';
    MapLadder.prototype.css_symbol = '☰';
    return MapLadder;
  })();
  MapRope = (function() {
    __extends(MapRope, BaseObject);
    function MapRope() {
      MapRope.__super__.constructor.apply(this, arguments);
    }
    MapRope.prototype.movable = true;
    MapRope.prototype.hangable = true;
    MapRope.prototype.css_class = 'object-rope';
    MapRope.prototype.css_symbol = '⎺';
    return MapRope;
  })();
  MapConcrete = (function() {
    __extends(MapConcrete, BaseObject);
    function MapConcrete() {
      MapConcrete.__super__.constructor.apply(this, arguments);
    }
    MapConcrete.prototype.css_class = 'object-concrete';
    MapConcrete.prototype.css_symbol = '▓';
    MapConcrete.prototype.flyable = true;
    return MapConcrete;
  })();
  MapDoor = (function() {
    __extends(MapDoor, BaseObject);
    function MapDoor() {
      MapDoor.__super__.constructor.apply(this, arguments);
    }
    MapDoor.prototype.css_class = 'object-door';
    MapDoor.prototype.css_symbol = '⚐';
    return MapDoor;
  })();
  MapGold = (function() {
    __extends(MapGold, BaseObject);
    function MapGold() {
      MapGold.__super__.constructor.apply(this, arguments);
    }
    MapGold.prototype.movable = true;
    MapGold.prototype.fallable = true;
    MapGold.prototype.css_class = 'object-gold';
    MapGold.prototype.css_symbol = '☢';
    MapGold.prototype.bonus_amount = 10;
    MapGold.prototype.pick_up = function(player, map) {
      map.replace(this, MapEmpty);
      return player != null ? player.add_bonus(this.bonus_amount) : void 0;
    };
    return MapGold;
  })();
  window.Map = Map;
  window.MapDigBrick = MapDigBrick;
  window.MapFlagged = MapFlagged;
}).call(this);
