import {expect} from "chai"
import * as RQ from "async-rq"
// let RQ = require("async-rq")

import {client} from "../src/MuonClient"

describe("Gateway tests", function () {

//    this.timeout(3000000);
  let serviceName = "example-service";
  let amqpurl = process.env.MUON_URL || "amqp://muon:microservices@localhost";

  let muon
  let muon2
  let gw

  beforeAll(function () {
    jest.setTimeout(3000000)
    // global.window = {
    //     location: {
    //         hostname: "localhost"
    //     }}

    // require("muon-amqp").attach(muoncore)
    //
    // muon = muoncore.create("gateway-testing", amqpurl);
    // require("muon-stack-rpc").create(muon)
    // muon.handle('/tennis', function (event, respond) {
    //     console.log('*****  muon://service/tennis: muoncore-test.js *************************************************');
    //     console.log('rpc://service/tennis server responding to event=' + JSON.stringify(event));
    //     respond("pong");
    // });
    //
    // muon2 = muoncore.create("target-service-muonjs", amqpurl);
    // require("muon-stack-rpc").create(muon2)
    // muon2.handle('/tennis', function (event, respond) {
    //   console.log('*****  muon://service/tennis: muoncore-test.js *************************************************');
    //   console.log('rpc://service/tennis server responding to event=' + JSON.stringify(event));
    //     respond("pong");
    // });
    //
    // gw = require("../src/index").gateway({ port: 56078, muon: muon})
  });

  afterAll(function () {
    // if (gw) gw.shutdown()
    // if (muon) muon.shutdown();
    // if (muon2) muon2.shutdown();
  });

  it("functional check", async function () {

    let clientmuon = await client({
      url: "wss://ws.cloud.daviddawson.me",
      serviceName: "functional-check"
    })


    require("muon-stack-rpc").create(clientmuon)

    let respo = await clientmuon.introspect("photonlite")
    console.dir(respo)


    let response = await clientmuon.request('rpc://photonlite/stats', "ping");

    console.log("rpc://example-client server response received! response=" + JSON.stringify(response));
    console.log("muon promise.then() asserting response...");
    console.log("Response is " + JSON.stringify(response))
    expect(response, "request response is undefined");
    expect(response.body).to.eq("pong")

  });
  // it("soak test", function (done) {
  //   let clientmuon = require("../src/index").client({port: 56078})
  //
  //   let soak = RQ.sequence([
  //     RQ.parallel([
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //     ]),
  //     requestFactory(clientmuon),
  //     requestFactory(clientmuon),
  //     delay(6000),
  //     requestFactory(clientmuon),
  //     requestFactory(clientmuon),
  //     delay(10000),
  //     requestFactory(clientmuon),
  //     requestFactory(clientmuon),
  //     delay(20000),
  //     RQ.parallel([
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //       requestFactory(clientmuon),
  //     ]),
  //     delay(15000)
  //   ])
  //
  //   subscribe(clientmuon, "fast-as-possible")
  //   // subscribe(clientmuon, "large-payload")
  //   // subscribe(clientmuon, "fast-as-possible")
  //
  //   // soak(function (data) {
  //   //     console.log("SOAK TEST DONE")
  //   //     console.dir(data)
  //   //     done()
  //   // })
  // })
});


function delay(milliseconds) {
  return function requestor(callback, value) {
    let timeout_id = setTimeout(function () {
      return callback(value);
    }, milliseconds);
    return function cancel(reason) {
      return clearTimeout(timeout_id);
    };
  };
}

function requestFactory(muon) {
  return function request(done, val) {
    console.log('Requesting data ');
    let then = new Date().getTime()
    let promise = muon.request('rpc://env-node/string-response', {"search": "red"});
    promise.then(function (event) {
      let now = new Date().getTime()
      console.log("Response is " + JSON.stringify(event))
      console.log("Latency is " + (now - then))
      done()
    }).catch(function (error) {
      console.dir("FAILED< BOOO " + error)
      done()
    })
  }
}

function subscribe(muon, end) {
  muon.subscribe("stream://env-jvm/" + end, {},
    function (data) {
      console.dir(data)
    },
    function (error) {
      console.log("Errored...")
      console.dir(error)
    },
    function () {
      console.log("COMPLETED STREAM")
    }
  )
}
