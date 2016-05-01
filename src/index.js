require("sexylog")

var Muon = require("muon-core")
var transport = require("./ws/transport")
var discovery = require("./ws/discovery")

module.exports = function() {
    
    //detect the browser setup. 

    var serviceName = "browser-instance"
    var websockurl = "ws://localhost:5000/transport"
    var discoverurl = "ws://localhost:5000/discover"

    //TODO construct a muon with the browser transport and discovery
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
    
    var muon = Muon.api(serviceName, infrastructure)

    setTimeout(function() {
        muon.request("rpc://tckservice/echo", {hello: "owlrd"}, function (ret) {
            logger.info("GOT DATA BACK!")
            console.dir(ret)
        });
    }, 1000);
    
}