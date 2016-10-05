
var $ = require("jquery")
var jsonMarkup = require("json-markup")
var muon = require("../../src/index.js").client({port:9898})
//
function requestUsers() {
    muon.request("rpc://corgi-email/notifications", {"user": "Hanna"}, function (resp) {
        var html = jsonMarkup(resp)
        $("#response").html("<div><h1>" + new Date() + "</h1>" +html + "</div>")
    });
}

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

muon.subscribe("stream://back-end/board/globalstate", {"user": "Hanna"}, function(data) {
    logger.info("GOT DATA!" + JSON.stringify(data))
    $("#boards").text("COMPLETE? " + JSON.stringify(data))
}, function(dat) {
    var html = jsonMarkup(dat)
    $("#boards").html(html)

    logger.info("Completed" +JSON.stringify(dat))
}, function(err) {
    $("#boards").text("ERROR " + JSON.stringify(err))
    logger.info("Error")
})


setInterval(requestUsers, 2000)

