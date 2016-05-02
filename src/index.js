require("sexylog")

var Muon = require("muon-core")
var transport = require("./ws/transport")
var discovery = require("./ws/discovery")
var ws = require("ws")

module.exports.gateway = function(httpExpress, muon) {
    var WebSocketServer = ws.Server

    var wss = new WebSocketServer({server: httpExpress, path:"/discover"})
    logger.log("websocket server created")

    wss.on("connection", function(ws) {
        //todo, tap the discovery and propogate to clients.
        //todo,enable filtering of which services are propogated.

        var interval = setInterval(function() {
            // ws.send(JSON.stringify({
            //     identifier:"simples"
            // }), function() {  })
        }, 2000);

        ws.on('message', function message(data, flags) {
            console.log("DUISCOVERY GOT DATA...." + JSON.stringify(data));

        });

        console.log("websocket discovery connection open")

        ws.on("close", function() {
            console.log("websocket connection close")
            clearInterval(interval);
        })
    });

    var transport = new WebSocketServer({server: httpExpress, path:"/transport"})
    console.log("websocket trasport server created")

    transport.on("connection", function(ws) {

        var connections = {};

        console.log("websocket transport connection open")

        //TODO, hook into a muon transport to forward messages to this.
        //todo, implement how to open/ close channels.
        //

        ws.onmessage = function(data) {
            console.log("Hello??");
        };

        ws.on('message', function message(data, flags) {
            var myData = JSON.parse(data);
            console.dir(myData);
            var channelId = myData.channelId;
            var targetService = myData["target_service"];
            var protocol = myData.protocol;
            // TODO, this should be an optional override.
            myData.origin_service = muon.infrastructure().config.serviceName;

            var internalChannel = connections[channelId];

            if (internalChannel == undefined) {
                logger.debug("Establishing new channel to " + targetService + protocol);
                internalChannel = muon.transportClient().openChannel(targetService, protocol);
                connections[channelId] = internalChannel;
                internalChannel.listen(function(msg) {
                    logger.debug("Sending message back down ws for channel " + channelId);
                    msg["channelId"] = channelId;
                    ws.send(JSON.stringify(msg));
                });
            }

            console.log("Routing message on channel: " + channelId);
            delete myData.channelId;
            internalChannel.send(myData);
        });

        ws.on("close", function() {
            // TODO, destroy the channel connections that hook into this.
            console.log("websocket connection close")
        })
    });

}

module.exports.client = function() {
    
    //detect the browser setup. 

    var serviceName = "browser-instance"
    var websockurl = "ws://localhost:5000/transport"
    var discoverurl = "ws://localhost:5000/discover"

    //TODO construct a muon with the browser transport and discovery. Use the location origin to detect what this should be.
    logger.info("HELLO WORLD, THIS IS AWESOME!")

    
    var serverStacks = new Muon.ServerStacks(serviceName);

    var infrastructure = {
        config: {},
        discovery: new discovery(discoverurl),
        transport: new transport(serviceName, serverStacks, websockurl),
        serverStacks: serverStacks,
        shutdown: function() {
            //shutdown stuff...
        }
    }
    
    return Muon.api(serviceName, infrastructure)
}