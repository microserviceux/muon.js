require("sexylog")

var _ = require("underscore")
var http = require("http")
var Muon = require("muon-core")
var transport = require("./ws/transport")
var discovery = require("./ws/discovery")
var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};

module.exports.gateway = function(conf) {
    
    var muon = conf.muon
    var app=conf.app
    var port = conf.port || 9999
    
    console.dir(muon)

    var discovery = require('sockjs').createServer(sockjs_opts);
    var transport = require('sockjs').createServer(sockjs_opts);
    
    if (app == undefined) {
        logger.info("No existing application passed in, will create a new http endpoint on port " + port)
        var server = http.createServer();
        server.addListener('upgrade', function(req,res){
            res.end();
        });
        discovery.installHandlers(server, {prefix:'/discover'});
        transport.installHandlers(server, {prefix:'/transport'});
        server.listen(9999, '0.0.0.0');
    }

    discovery.on('connection', function(ws) {
        logger.info("Discovery connected")
        ws.on('data', function(message) {
            console.log("DUISCOVERY GOT DATA...." + JSON.stringify(message));
        });
        var interval = setInterval(function() {
            // ws.send(JSON.stringify({
            //     identifier:"simples"
            // }), function() {  })
        }, 2000);
        ws.on("close", function() {
            console.log("websocket connection close")
            clearInterval(interval);
        })
    });

    transport.on("connection", function(ws) {
        console.log("Transport connected")
    
        var connections = {};
    
        console.log("websocket transport connection open")
    
        ws.on('data', function message(data) {
            
            muon.infrastructure().getTransport().then(function(transport) {
                var myData = JSON.parse(data);
                console.dir(myData);
                var channelId = myData.channelId;
                var targetService = myData["target_service"];
                var protocol = myData.protocol;
                // TODO, this should be an optional override.
                myData.origin_service = muon.infrastructure().config.serviceName;

                var internalChannel = connections[channelId];
                
                logger.info("ROUTING MESSAGE " + JSON.stringify(myData))

                if (myData.channel_op == "closed") {
                    logger.debug("SHUTDOWN CHANNEL BY CLIENT REQUEST")
                    internalChannel.shutdown()
                    delete connections[channelId]
                } else {
                    if (internalChannel == undefined) {
                        logger.debug("Establishing new channel to " + targetService + protocol);
                        internalChannel = transport.openChannel(targetService, protocol);
                        connections[channelId] = internalChannel;
                        internalChannel.listen(function (msg) {
                            logger.debug("Sending message back down ws for channel " + channelId);
                            msg["channelId"] = channelId;
                            ws.write(JSON.stringify(msg));
                        });
                    }
                    // console.log("Routing message on channel: " + channelId);
                    delete myData.channelId;
                    internalChannel.send(myData);
                }
            })
        });
    
        ws.on("close", function() {
            // TODO, destroy the channel connections that hook into this.
            console.log("websocket connection close")

            _.each(connections, function(conn) {
                conn.send(Muon.Messages.shutdownMessage())
                conn.close()
            })
            connections = null
        })
    });
}

module.exports.client = function() {
    
    //detect the browser setup. 

    // var port = window.location.port
    var host = window.location.hostname

    var port = 9999
    
    var basews = "http://" + host + ":" + port
    
    var serviceName = "browser-instance"
    var websockurl = basews + "/transport"
    var discoverurl = basews + "/discover"

    var serverStacks = new Muon.ServerStacks(serviceName);

    var trans = new transport(serviceName, serverStacks, websockurl)
    
    var infrastructure = {
        config: {},
        discovery: new discovery(discoverurl),
        transport: trans,
        getTransport: function() { return trans.promise },
        serverStacks: serverStacks,
        shutdown: function() {
            //shutdown stuff...
        }
    }
    
    return Muon.api(serviceName, infrastructure)
}