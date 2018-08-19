

import {client} from "../src/MuonClient"


async function exec() {
  const muon = await client({
    url: "ws://localhost:8092",
    serviceName: "awesome",
    tags: ["testing"]
  })
  require("muon-stack-rpc").create(muon)

}


exec()
