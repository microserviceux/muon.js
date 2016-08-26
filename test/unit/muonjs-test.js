var assert = require('assert');
var expect = require('expect.js');

var muonjs = require("../../src/index")


describe("muonjs tests", function () {

    it("can connect and send data from a client to server side channel", function (done) {

        GLOBAL.window = {
            location: {
                hostname:"localhost"
            }
        }

        muonjs.gateway({
            port:9999
        })

        var muonclient = muonjs.client()

        


        assert.fail("Not done")
    });

    it("closes server channel when client channel shuts down", function (done) {

        //low level control, start client channel. see server channel assigned.
        //send channel_op:shutdown up client channel, observe server channel removed.

        assert.fail("Not done")
    })

    it("can use RPC protocol", function (done) {

        //low level control, start client channel. see server channel assigned.
        //send channel_op:shutdown up client channel, observe server channel removed.

        assert.fail("Not done")
    })

    it("can use streaming protocol", function (done) {

        //low level control, start client channel. see server channel assigned.
        //send channel_op:shutdown up client channel, observe server channel removed.

        assert.fail("Not done")
    })
});
