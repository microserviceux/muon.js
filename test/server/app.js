
var $ = require("jquery")
var jsonMarkup = require("json-markup")
var muon = require("../../src/index.js").client()
//
muon.request("rpc://back-end/board/list", {"message": "BE AWESOME"}, function(resp) {
    var html = jsonMarkup(resp)
    $("#response").html(html)
});

logger.info("Starting streaming connection!")
muon.subscribe("stream://awesomeservicequery/ticktock", function(data) {
    logger.info("GOT DATA!" + JSON.stringify(data))
    $("#stream").text("COMPLETE? " + JSON.stringify(data))
}, function(dat) {
    var html = jsonMarkup(dat)
    $("#stream").html(html)
    
    logger.info("Completed" +JSON.stringify(dat))
}, function(err) {
    $("#stream").text("ERROR " + JSON.stringify(err))
    logger.info("Error")
})

// setInterval(function(){
//     var then = new Date().getTime();
//     muon.request("rpc://tckservice/echo", {"message": "BE AWESOME"}, function(resp) {
//         var now = new Date().getTime();
//         logger.info("Latency = " + (now - then))
//         console.dir(resp)
//     });
// }, 2000)

