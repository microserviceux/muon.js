import {expect} from "chai"
import * as RQ from "async-rq"
// let RQ = require("async-rq")

import {client} from "../src/MuonClient"

import * as proxy from "node-tcp-proxy"

describe("Gateway tests", function () {

//    this.timeout(3000000);
  let serviceName = "example-service";
  let amqpurl = process.env.MUON_URL || "amqp://muon:microservices@localhost";

  let muon
  let muon2
  let prox

  beforeAll(async function () {
    jest.setTimeout(3000000)
    // global.window = {
    //     location: {
    //         hostname: "localhost"
    //     }}

    // require("muon-amqp").attach(muoncore)
    //
    // muon = muoncore.create("gateway-testing", amqpurl);
    // require("muon-stack-rpc").create(muon)


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

  afterEach(function () {
    if (muon) muon.shutdown();
    if (muon2) muon2.shutdown();
    if (prox) prox.end();
  });

  it("functional check", async function () {

    muon = await client({
      url: "ws://localhost:8092",
      serviceName: "myservice",
      tags: []
    })
    require("muon-stack-rpc").create(muon)

    muon.handle('/tennis', function (event, respond) {
      console.log('*****  muon://service/tennis: muoncore-test.js *************************************************');
      console.log('rpc://service/tennis server responding to event=' + JSON.stringify(event));
      respond("pong");
    });

    muon2 = await client({
      url: "ws://localhost:8092",
      serviceName: "functional-check",
      tags: []
    })

    require("muon-stack-rpc").create(muon2)

    let respo = await muon2.introspect("myservice")
    console.dir(respo)


    let response = await muon2.request('rpc://myservice/tennis', "ping");

    console.log("rpc://example-client server response received! response=" + JSON.stringify(response));
    console.log("muon promise.then() asserting response...");
    console.log("Response is " + JSON.stringify(response))
    expect(response, "request response is undefined");
    expect(response.body).to.eq("pong")

  });

  it ("reconnect test", async () => {

    prox = proxy.createProxy(8091, "localhost", "8092", {quiet: false, tls: false})

    muon = await client({
      url: "ws://localhost:8091",
      serviceName: "myservice",
      tags: []
    })
    require("muon-stack-rpc").create(muon)

    muon.handle('/tennis', function (event, respond) {
      console.log('*****  muon://service/tennis: muoncore-test.js *************************************************');
      console.log('rpc://service/tennis server responding to event=' + JSON.stringify(event));
      respond("pong");
    });

    muon2 = await client({
      url: "ws://localhost:8092",
      serviceName: "functional-check",
      tags: []
    })

    require("muon-stack-rpc").create(muon2)

    await pause(1000)

    console.log("Killing net connection to gateway")
    prox.end()

    await pause(12000)

    console.log("Restarting net connection")
    prox = proxy.createProxy(8091, "localhost", "8092", {quiet: false, tls: false})

    await pause(1500)

    let response = await muon2.request('rpc://myservice/tennis', "ping");
    console.log("Response is " + JSON.stringify(response))
    expect(response, "request response is undefined");
    expect(response.body).to.eq("pong")

  })
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

async function pause(millis: number) {
  return new Promise(done => {
    setTimeout(done, millis)
  })
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
