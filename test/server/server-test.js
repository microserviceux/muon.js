
require("sexylog")

var Muon = require("muon-core");

var muon = Muon.create("my-tester", process.env.MUON_URL || "amqp://muon:microservices@localhost");

muon.request("rpc://back-end/board/list", {"message": "BE AWESOME"}, function(resp) {
    logger.info("GOT RPC DATA - " + JSON.stringify(resp))
});

logger.info("Starting streaming connection!")
muon.subscribe("stream://awesomeservicequery/ticktock", function(data) {
    logger.info("GOT DATA!" + JSON.stringify(data))
    logger.info("COMPLETE? " + JSON.stringify(data))
}, function(dat) {

    logger.info("COMPLETED " + JSON.stringify(dat))
}, function(err) {
    logger.info("ERROR " + JSON.stringify(err))
})


muon.subscribe("stream://awesomeservicequery/ticktock", function(data) {
    logger.info("GOT DATA!" + JSON.stringify(data))
    logger.info("COMPLETE? " + JSON.stringify(data))
}, function(dat) {

    logger.info("COMPLETED " + JSON.stringify(dat))
}, function(err) {
    logger.info("ERROR " + JSON.stringify(err))
})

setInterval(function() {
    muon.request("rpc://product/list", {"message": "BE AWESOME"}, function(resp) {
        logger.info("GOT RPC DATA - " + JSON.stringify(resp))
    });
}, 1000)
