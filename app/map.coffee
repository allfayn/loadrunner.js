class Map

    object_static: []
    object_dynamic: []

    constructor: (properties) ->
        {gold_minimum: @gold_minimum} = properties
        @unsolved = true

    parse_text: (text) ->
        for y in [0..text.length-1]
            raw = text[y]
            row = []
            for x in [0..raw.length-1]
                object = @parse_char(raw[x],x,y)
                if object.active
                    row.push(new MapEmpty)
                    @object_dynamic.push(object)
                else
                    row.push(object)
            @object_static.push(row)
        @width = row.length
        @height = text.length

    parse_char: (char, x, y) ->
        switch char
            when "X" then return new MapConcrete(x,y)
            when "|" then return new MapLadder(x,y)
            when "-" then return new MapRope(x,y)
            when "B" then return new MapBrick(x,y)
            when "." then return new MapEmpty(x,y)
            when "P" then return new MapUser(x,y)
            when "@" then return new MapGold(x,y)
            when "M" then return new MapMonster(x,y)
            when "F"
                @moster_factory = new MapEmpty(x,y)
                return @moster_factory
            when "E"
                @flag = new MapFlag(x,y)
                return @flag

            else
                console.log("Wrong char in map:", char)
                return new MapEmpty(x,y)

    get_player: ->
        for i in @object_dynamic
            if i.is_player
                return i
    get_mosters: ->
        result = []
        for i in @object_dynamic
            if i.is_monster
                result.push(i)
        return result


    get_fg: (x, y)->
        for obj in @object_dynamic
            if obj.x == x and obj.y == y
                return obj
        return false

    get_bg: (x, y)->
        return @object_static[y]?[x]

    get_objects: ->
        res = []
        res = res.concat(@object_dynamic)
        for row in @object_static
            res = res.concat(row)
        return res

    replace: (old, typ) ->
        parent = old.html.parent()
        old.html.remove()
        block = new typ(old.x, old.y)
        @object_static[old.y][old.x] = block
        parent.append(block.get_html())
        return block

class BaseObject
    movable: false
    fallable: false
    flyable: false  # for ladders and holes

    freeze: 0  # number of moves
    hangable: false
    active: false
    css_class: 'object'
    css_size: 32
    css_symbol: ''
    weight: 256

    constructor: (@x, @y) ->

    set_weight: (@weight) ->

    get_html: ->
        @html = $('<div>').text(@css_symbol).addClass(@css_class)
        @set_position(@x, @y)
        return @html

    set_position: (@x, @y) ->
        @html.stop(true,true).css({
            top: @y*@css_size + 'px',
            left: @x*@css_size + 'px'
        })

    animate: (x, y, speed) ->
        speed = speed || window.game.speed
        @html.stop().animate({
            top: y*@css_size + 'px',
            left: x*@css_size + 'px'
        },speed,'linear')

class BaseActionObject extends BaseObject
    active: true

class MapBrick extends BaseObject
    css_class: 'object-brick'
    css_symbol: '▒'
    flyable: true
    diggable: true

class MapDigBrick extends BaseObject
    fallable: true
    freeze: 5
    digtime: 10
    css_class: 'object-digbrick'
    css_symbol: '░'

    start: (@dispatcher) ->
        @cur_freeze = @digtime

    tick: ->
        @cur_freeze -= 1
        if not @cur_freeze
            # TODO(tailhook) eat monster or player
            @dispatcher.remove(this)
            map = @dispatcher.face.map
            map.replace(this, MapBrick)  # sorry
            pl = map.get_fg(@x, @y)
            if pl
                pl?.controller.kill()

class MapUser extends BaseActionObject
    is_player: true
    css_class: 'object-user'
    css_symbol: '♿'

class MapMonster  extends BaseActionObject
    css_class: 'object-monster'
    css_symbol: '♿'
    is_monster: true
    transform: (action) ->
        switch action
            when "moveleft"
                scale = 'scale(-1, 1)'
                @html.css({ '-moz-transform': scale, '-webkit-transform': scale})
            when "moveright"
                scale = 'scale(1, 1)'
                @html.css({ '-moz-transform': scale, '-webkit-transform': scale})
            when "movelefttern"
                scale = 'scale(-1,-1)'
                @html.css({ '-moz-transform': scale, '-webkit-transform': scale})
            when "moverighttern"
                scale = 'scale(1, -1)'
                @html.css({ '-moz-transform': scale, '-webkit-transform': scale})



class MapEmpty  extends BaseObject
    fallable: true
    movable: true
    css_class: 'object-empty'
    css_symbol: ''
    
    get_back: (map) ->
        map.replace(this, MapGold)

class MapFlag extends MapEmpty

class MapFlagged extends MapFlag
    css_class: 'object-door'
    css_symbol: '⚐'
class MapLadder  extends BaseObject
    hangable: true
    flyable: true
    movable: true
    css_class: 'object-ladder'
    css_symbol: '☰'

class MapRope  extends BaseObject
    movable: true
    hangable: true
    css_class: 'object-rope'
    css_symbol: '⎺'

class MapConcrete  extends BaseObject
    css_class: 'object-concrete'
    css_symbol: '▓'
    flyable: true

class MapDoor extends BaseObject
    css_class: 'object-door'
    css_symbol: '⚐'

class MapGold extends BaseObject
    movable: true
    fallable: true
    css_class: 'object-gold'
    css_symbol: '☢'
    bonus_amount: 10

    pick_up: (player, map) ->
        map.replace(this, MapEmpty)
        player?.add_bonus(@bonus_amount)

window.Map = Map
window.MapDigBrick = MapDigBrick
window.MapFlagged = MapFlagged
