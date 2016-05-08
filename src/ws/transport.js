var _ = require("underscore");
var bichannel = require('muon-core').channel();
var uuid = require("node-uuid");

var SockJS = require("sockjs-client")

var BrowserTransport = function (serviceName, serverStacks, url) {

    var trans = this;
    this.url = url
    this.isOpen = false
    this.initTransport();
    
    this.ws.onclose = function() {
        logger.info("CLOSED CONNECITION")
        this.isOpen = false

        setTimeout(function() {
            trans.initTransport();
        }, 1000);
    }.bind(this)
};

BrowserTransport.prototype.initTransport = function() {
    logger.info("Booting transport, sock js is currently closed and buffer queue is accepted messages")

    this.ws = new SockJS(this.url);

    this.channelConnections = {};
    var transport = this;

    this.ws.onopen = function() {
        transport.isOpen = true;
        logger.info("SockJS becomes ready, draining connection buffers")
        _.each(this.channelConnections, function(connection) {
            connection.drainQueue()
        })
    }.bind(this)
    
    this.ws.onmessage = function (event) {
        logger.debug("MESSAGE RECEIVED FROM SERVER: " + JSON.stringify(event.data));
        var data = JSON.parse(event.data);
        var channelId = data.channelId;
        var connection = transport.channelConnections[channelId];
        connection.channel.rightConnection().send(data);
    };
}

BrowserTransport.prototype.openChannel = function(serviceName, protocolName) {

    var transport = this;

    //TODO, do we need a queue? [yes!]

    var channelConnection = {
        channelId:uuid.v1(),
        serviceName: serviceName,
        protocolName: protocolName,
        channelOpen:true,
        outboundBuffer:[],
        drainQueue: function() {

            _.each(this.outboundBuffer, function(el) {
                this.send(el);
            }.bind(this));
            logger.trace("[***** TRANSPORT *****] send " + this.outboundBuffer.length + " pending messages");
            this.outboundBuffer = [];
        },
        shutdown: function() {
            logger.info("[***** TRANSPORT *****] CHANNEL POISONED");

            this.send({
                headers:{
                    eventType:"ChannelShutdown",
                    id:"simples",
                    targetService:"",
                    sourceService:"",
                    protocol:"",
                    "Content-Type":"application/json",
                    sourceAvailableContentTypes:["application/json"],
                    channelOperation:"CLOSE_CHANNEL"
                },
                payload:{
                    be:"happy"
                }
            });
        },
        send: function(msg) {
            try {
                if (!transport.isOpen) {
                    logger.info("[***** TRANSPORT *****] Transport is not yet ready, buffering message")
                    this.outboundBuffer.push(msg)
                } else {
                    msg.channelId = channelConnection.channelId;

                    var out = JSON.stringify(msg);

                    logger.info("[***** TRANSPORT *****] Sending event outbound to browser transport " + out);
                    transport.ws.send(out);
                }
            } catch (err) {
                console.log("[***** TRANSPORT *****] Error received");
                console.dir(err)
            }
        }
    };

    this.channelConnections[channelConnection.channelId] = channelConnection;

    channelConnection.channel = bichannel.create("browser-transport");

    channelConnection.channel.rightConnection().listen(function(msg) {
        logger.info("[***** TRANSPORT *****] received outbound event");
        if (msg == "poison") {
            channelConnection.shutdown();
            return;
        }
        if(channelConnection.channelOpen) {
            channelConnection.send(msg);
        } else {
            channelConnection.outboundBuffer.push(msg);
        }
    }.bind(channelConnection));

    return channelConnection.channel.leftConnection();
};


BrowserTransport.prototype.shutdown = function() {
    //TODO, more shutdowns.
};

module.exports = BrowserTransport;

