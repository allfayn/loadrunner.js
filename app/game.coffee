class Game
    constructor: () ->
        @levels = {}

    load_level: (name) ->
        @load_map(name, @_map_loaded)

    _map_loaded: (map) =>
        item = map.get_player()
        @interface = new LevelInterface(map)
        @dispatcher = new Dispatcher(@interface, this)
        @player = new Player(map, item)
        @dispatcher.add(@player)
        @monsters = []
        for obj in map.get_mosters()
            if obj.is_monster
                monster = new Monster(map, obj, @player)
                @monsters.push(monster)
                @dispatcher.add(monster)
        for obj in map.get_objects()
            @interface.add(obj)

    load_map: (name, fun) ->
        fun(@levels[name])

    start: ->
        @dispatcher.start()

    stop: ->
        @dispatcher.stop()

class LevelInterface

    constructor: (map) ->
        @map = map
        @container = $('#game')
        @container.css(
            width: @map.width*32 + 'px'
            height: @map.height*32 + 'px'
            )
        @level = $('<div id="level">')
        @mapdiv = $('<div id="map">')
        @level.append(@mapdiv)
        @container.append(@level)

    add: (obj) ->
        @mapdiv.append(obj.get_html())

    update: (map) ->
        # move graphic elements appropriately

class Player

    constructor: (@map, item) ->
        @left = false
        @item = item
        @item.controller = this
        @x = @item.x
        @y = @item.y
        @score = 0

    start: (disp) ->
        @dispatcher = disp
        @tickfunc = @check_keys

    add_bonus: (value) ->
        @score += value
        $("#score").text(@score)
        $("#dead").text("MOAR!MOAR!MOAR")
        
    kill: ->
        $("#dead").text("NNNNNNNNNNOOOOOOOOOOOOOO!!!!!")
        @dispatcher.remove(this)

    tick: ->
        #console.log("SCORE", @score, @map.gold_minimum, @map.unsolved, @map.flag)
        if @map.unsolved
            if @score >= @map.gold_minimum and @map.unsolved
                # Sorry --v
                @map.flag = @map.replace(@map.flag, MapFlagged)
                @map.unsolved = false
        else
            if @map.flag.x == @x and @map.flag.y == @y
                $("#dead").text("You Win!")
                @dispatcher.objects = []  # sorry again
                return
        @tickfunc()

    check_keys: =>
        if @dispatcher.key('37')  # arrow left
            if @map.get_bg(@x, @y).freeze and @map.get_bg(@x-1, @y-1)?.movable
                @left = true
                @move(@x-1, @y-1, 'moveleftup')
                return
            if @map.get_bg(@x-1, @y)?.movable and not @map.get_fg(@x-1, @y)
                @left = true
                @move(@x-1, @y, 'moveleft')
                return
        if @dispatcher.key('39')  # arrow right
            if @map.get_bg(@x, @y).freeze and @map.get_bg(@x+1, @y-1)?.movable
                @left = false
                @move(@x+1, @y-1, 'moverightup')
                return
            if @map.get_bg(@x+1, @y)?.movable and not @map.get_fg(@x+1, @y)
                @left = false
                @move(@x+1, @y, 'moveleft')
                return
        if @dispatcher.key('38')  # arrow up
            if @map.get_bg(@x, @y).flyable and @map.get_bg(@x, @y-1)?.movable
                @move(@x, @y-1, 'fly')
                return
        if @dispatcher.key('40')  # arrow down
            m = @map.get_bg(@x, @y+1)?.movable
            if m
                @move(@x, @y+1, 'movedown')
                return
        if @dispatcher.key('32')  # space
            if @left
                x = @x-1
            else
                x = @x+1
            m = @map.get_bg(x, @y)?.movable
            d = @map.get_bg(x, @y+1)?.diggable
            if d and m
                @tickfunc = (=> @dig_done(x, @y+1))
                return
        @tickfunc = @check_keys

    move: (tox, toy, animation) ->
        @item.animate(tox, toy)
        scale = if @left then 'scale(-1, 1)' else 'scale(1, 1)'
        @item.html.css({ '-moz-transform': scale, '-webkit-transform': scale})
        # TODO(tailhook) dispatch animation
        @tickfunc = (=> @move_done(tox, toy))

    move_done: (@x, @y) =>
        #TODO: notify map
        @item.set_position(@x, @y)

        if @map.get_bg(@x, @y).hangable
            @check_keys()
            return
        @map.get_bg(@x, @y).pick_up?(this, @map)
        if @map.get_bg(@x, @y+1)
            fall = @map.get_bg(@x, @y).fallable
            fly = @map.get_bg(@x, @y+1).flyable
            monster = @map.get_fg(@x, @y+1)
            if fall and not fly and not monster
                @move(@x, @y+1, 'falldown')
                return
        freeze = @map.get_bg(@x, @y)?.freeze
        if freeze
            # TODO(tailhook) freeze animation
            @tickfunc = @freeze_done
            @freezetimes = freeze
        else
            @check_keys()

    dig_done: (x, y) =>
        nbrick = @map.replace(@map.get_bg(x, y), MapDigBrick)
        @dispatcher.add(nbrick)
        @tickfunc = @check_keys

    freeze_done: =>
        @freezetimes -= 1
        if not @freezetimes
            @check_keys()

class Monster

    frozen: false
    has_gold: false
    player_coord: {}

    constructor: (@map,@item,@player) ->
        @item.controller = this
        @weight = 5+Math.round(Math.random()*21)

    start: (disp) ->
        @dispatcher = disp

    tick: ->
        if @freezetimes
            @freeze_done()
            return false
        if @tox and @toy
            @move_done(@tox,@toy)
        @move_to()

    kill: ->
        if @has_gold
            @map.get_bg(@x,@y-1).get_back(@map)
            @has_gold = false

        $("#dead").text("ARRRGGHHHHHHHH")
        if @map?.moster_factory
            @move_finish(@map.moster_factory.x,@map?.moster_factory.y)
            @tox = @x
            @toy = @y
            @freezetimes = 5
        else
            @dispatcher.remove(this)

    move_to: () ->
        @player_coord.x = @player.x
        @player_coord.y = @player.y
        if @freezetimes > 0
            return false
        start = [@item.x,@item.y]
        finish = [@player.x,@player.y]
        if @player.freezetimes
            finish[1] -=1
        weight = 1;
        listing =
            arr:[]
            has:->
                return @arr
            get: ->
                arr = @arr
                @arr = []
                return arr
            add: (list) ->
                @arr.push(list)

        listing.add(start)
        objects = @map.object_static
        for row in objects
            for obj in row
                obj.set_weight(256)
                #if obj?.freeze
                    #obj.fallable = false
                    #obj.flyable = true

        objects[start[1]][start[0]]?.set_weight(255)
        while listing.has().length
            for item in listing.get()
                for move_to in ['left','right','up','down']
                    res = @check_path(item[0],item[1],move_to, objects)
                    if res
                       if res[0] == finish[0] and res[1] == finish[1]
                            #objects[finish[1]][finish[0]]?.set_weight(0)
                            if !@return_path(objects,res[0],res[1],start)
                                @x = -1
                                @y = -1
                            return
                        if objects[res[1]][res[0]]?.weight == 256
                            listing.add(res)
                            #console.log(item,res,move_to,weight)
                            objects[res[1]][res[0]]?.set_weight(weight)
            #console.log(item,listing.has())
            weight+=1
            if weight>@weight
                @return_path(objects,item[0],item[1],start)
                return
                
        return false

    return_path:(objects,x,y,start)->
        action = ''
        value = 4000
        while true
            res = []
            res.push([objects[y-1][x]?.weight,x,y-1,'movedown'])
            res.push([objects[y+1][x]?.weight,x,y+1,'moveup'])
            res.push([objects[y][x-1]?.weight,x-1,y,'moveright'])
            res.push([objects[y][x+1]?.weight,x+1,y,'moveleft'])
            for item in res
                if @map.get_bg(@x, @y)?.freeze
                    if (x-1 == start[0] and y+1 == start[1]) or (x+1 == start[0] and y+1 == start[1])
                        @move(x, y, item[3])
                        return true
                if value == 4000 and item[1] == start[0] and item[2] == start[1]
                    @move(x, y, item[3])
                    return true
            for item in res
                if item[0] == 255
                    @move(x, y, action)
                    return true
                if item[0]<value
                    value = item[0]
                    x = item[1]
                    y = item[2]
                    action = item[3]
        return false

    check_path: (x,y,to,objects) ->
        if @map.get_bg(@x, @y)?.freeze
            if to == 'left'
                return [x-1, y-1]
            if to == 'right'
                return [x+1, y-1]
        if to == 'down'
            if !objects[y+1]?[x].movable
                return false
            else
                return [x, y+1]
            if objects[y][x]?.hangable and objects[y+1]?[x]?.movable
                return [x, y+1]
            if objects[y+1]?[x]?.flyable or objects[y+1]?[x]?.freeze
                return [x, y+1]
            if objects[y+1]?[x]?.fallable or !objects[y+1]?[x]?.freeze
                return [x, y+1]
        if to == 'up'
            if objects[y-1]?[x]?.movable and objects[y][x]?.flyable
                return [x, y-1]
        if to == 'left'
            if !objects[y]?[x-1]?.movable
                return false
            if objects[y][x].fallable and !objects[y+1]?[x]?.flyable and !objects[y+1]?[x]?.freeze
                return false
            if objects[y][x-1]?.movable
                 return [x-1, y]
            if !objects[y+1]?[x-1]?.flyable or objects[y+1]?[x-1]?.freeze or @map.get_fg(y+1,x-1)?.is_monster
                return [x-1, y]
        if to == 'right'
            if (objects[y]?[x]?.fallable and !objects[y+1]?[x]?.flyable) or objects[y+1]?[x-1]?.freeze or @map.get_fg(y+1,x+1)?.is_monster
                return false
            if objects[y]?[x+1]?.movable
                return [x+1, y]
        return false


    move: (tox, toy, animation) ->
        # TODO(tailhook) dispatch animation
        for obj in @dispatcher.objects
            if (obj?.item?.is_monster and obj?.tox == tox and obj?.toy == toy) and !obj.freezetimes
                return
        @tox = tox
        @toy = toy
        @action = animation
        @item.transform(@action)
        @item.animate(@tox, @toy)

    move_done: (@x, @y) =>
        #TODO: notify map
        @move_finish(@x, @y)

        if (@player.x == @x and @player.y == @y)
            @player.kill()
            @dispatcher.remove(@player)
            return

        if @has_gold == false
            @map.get_bg(@x, @y).pick_up?(this, @map)

        if @map.get_bg(@x, @y).hangable
            return
         
        if @map.get_fg(@x, @y+1)?.is_monster
            return

        freeze = @map.get_bg(@x, @y+1).freeze

        if freeze
            @move_finish(@x, @y+1)
            # TODO(tailhook) freeze animation
            @freezetimes = freeze
            return

        if @map.get_bg(@x, @y).fallable and not @map.get_bg(@x, @y+1).flyable
            @move(@x, @y+1, 'falldown')
            return

    kill_player: ->
        @player.kill()
        @dispatcher.remove(@player)
        return

    move_finish: (@x,@y) ->
        @item.set_position(@x, @y)
        if @player_coord
            if @player.y==@y and (@player_coord.x<=@x<=@player.x or @player_coord.x>=@x>=@player.x)
                @kill_player()
                return
            if @player.x==@x and (@player_coord.y<=@y<=@player.y or @player_coord.y>=@y>=@player.y)
                @kill_player()
                return
    add_bonus: (bonus) ->
        @has_gold = true

    freeze_done: =>
        @freezetimes -= 1

class Dispatcher

    constructor: (@face, @game) ->
        @queue = []
        @objects = []
        @keys = {}
        @started = false

    add: (obj) ->
        @objects.push(obj)
        if @started
            obj.start(this)

    remove: (obj) ->
        @objects.splice(@objects.indexOf(obj), 1)

    start: ->
        @_interval = setInterval(@tick, window.game.speed)
        for i in @objects
            i.start(this)
        @started = true
        $(document).keydown(@key_down)
        $(document).keyup(@key_up)

    stop: ->
        clearInterval(@_interval)
        $(document).unbind('keydown', @key_down)
        $(document).unbind('keyup', @key_up)

    key: (code) ->
        return @keys[code]

    key_down: (event) =>
        code = event.keyCode
        if event.shiftKey
            code = 's' + code
        if event.ctrlKey
            code = 'c' + code
        if event.altKey
            code = 'a' + code
        @keys[code] = 1

    key_up: (event) =>
        code = event.keyCode
        if event.shiftKey
            code = 's' + code
        if event.ctrlKey
            code = 'c' + code
        if event.altKey
            code = 'a' + code
        @keys[code] = -1

    tick: =>
        for i in @objects
            i.tick()
        for k, v of @keys
            if v < 0
                delete @keys[k]
        @face.update()

window.game = new Game()
window.game.speed = 400
$(document).ready(->
    window.game.load_level('0')
    window.game.start()
    )
