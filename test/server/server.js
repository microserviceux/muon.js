
require("sexylog")

var express = require("express")
var app = express()
var port = process.env.PORT || 5000
app.use(express.static("./test/server"))
//var server = http.createServer(app)

var Muon = require("muon-core");

var muon = Muon.create("browser-gateway", process.env.MUON_URL || "amqp://muon:microservices@localhost");
var muonjs = require("../../src/index").gateway({app:app, muon:muon})

logger.info("Started muon gateway")
app.listen(port)

logger.info("http server listening on %d", port)
