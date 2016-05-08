

var muon = require("../../src/index.js").client()

muon.request("rpc://tckservice/echo", {"message": "BE AWESOME"}, function(resp) {
    var now = new Date().getTime();
    console.dir(resp)
});

setInterval(function(){
    var then = new Date().getTime();
    muon.request("rpc://tckservice/echo", {"message": "BE AWESOME"}, function(resp) {
        var now = new Date().getTime();
        logger.info("Latency = " + (now - then))
        console.dir(resp)
    });
}, 2000)

