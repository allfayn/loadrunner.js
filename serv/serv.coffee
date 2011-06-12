game = require('app/game').game
require('app/map')
require('app/levels/0')

zmq = require('zeromq')
sys = require('sys')

input = zmq.createSocket('pull')
output = zmq.createSocket('pub')
input.connect('tcp://localhost:7002')
output.connect('tcp://localhost:7003')
counter = 0
pnumber = 0
players = {}

input.on('message', (cid, kind, content) ->
    kind = kind.toString('utf8')
    console.log(kind, content, pnumber)
    if kind == 'heartbeat'
        return
    if content
        content = content.toString('utf8')
    switch kind
        when "connect"
            counter += 1
            pnumber += 1
            pid = 'p' + counter
            players[cid] = pid
            output.send("subscribe", cid, "game")
            output.send("publish", "game", '["new_player", "'+pid+'"]')
            if pnumber == 1
                console.log("Starting")
                game.load_level('0')
                game.start()
        when "disconnect"
            pid = players[cid]
            if pid
                pnumber -= 1
            output.send("publish", "game", '["del_player", "'+pid+'"]')
            delete players[cid]
            if not pnumber
                game.stop()
        when "message"
            pid = players[cid]
            output.send("publish", "game", '["turn", "'+pid+'", '+content+']')
)

