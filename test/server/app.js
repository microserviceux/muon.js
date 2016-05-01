

var muon = require("../../src/index.js")()

setInterval(function(){
    var then = new Date().getTime();
    muon.request("rpc://tckservice/echo", {"message": "BE AWESOME"}, function(resp) {
        var now = new Date().getTime();
        logger.info("Latency = " + (now - then))
        // console.dir(resp)
    });
}, 2000)
