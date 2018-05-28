import * as WebSocket from "ws";
import * as Muon from "muon-core"
import WsDiscovery from "./WsDiscovery";
import WsTransport from "./WsTransport";


export async function client(conf: MuonConf): Promise<any> {

  if (conf.url == null) {
    conf.url = "wss://ws.muoncore.io"
  }

  // TODO, don't use the WS directly in MuonClient. add a system to auto re-create the WS on failure

  return new Promise<any>((res, rej) => {
    console.log("CONNECTING TO " + conf.url)
    let ws = new WebSocket(conf.url)

    ws.on("open", (ev) => {
      res(new MuonClient(ws, conf).muon())
    })
  })
}

export class MuonConf {
  url: string
  serviceName: string
  tags: string[]
}

export class MuonClient {

  private muonInstance
  private discovery: WsDiscovery
  private transport: WsTransport
  private infra: any

  constructor(readonly ws: WebSocket, readonly conf: MuonConf) {
    this.discovery = new WsDiscovery(this)
    this.transport = new WsTransport(this)

    ws.on("message", (ev) => {
      let msg = JSON.parse(ev.toString()) as Message
      if (msg.type == "discovery") {
        this.discovery.handleDiscoveryMessage(msg)
      } else {
        this.transport.handleTransportMessage(msg)
      }
    })

    ws.on("close", (ev) => {
      console.log("Closed")
    })

    let serviceName = "browser-client"

    if (this.conf.serviceName) {
      serviceName = this.conf.serviceName
    }

    let stacks = new Muon.ServerStacks(serviceName);

    this.infra = {
      config: {},
      discovery: this.discovery,
      transport: this,
      getTransport: async () => {
        return this
      },
      serverStacks: stacks,
      shutdown: function () {
        //shutdown stuff...
      }
    }

    this.muonInstance = Muon.api(serviceName, this.infra)
  }

  muon() {
    return this.muonInstance
  }

  openChannel(remoteServiceName, protocolName) {
    return this.transport.openChannel(remoteServiceName, protocolName)
  }

  onError(cb) {
    console.log("Error callback passed into browser transport, this is not currently used and will be ignored")
    // upstreamCallback = cb;
  }

  shutdown() {
    console.log("shutdown() called on browser transport. This is not currently used and will be ignored")
  }


  send(message: Message) {
    this.ws.send(JSON.stringify(message))
  }

  infrastructure() {
    return this.infra
  }

  close() {
    this.ws.close()
  }

  public encode(msg: any) {
    return Muon.Messages.encode(msg)
  }

  public decode(msg: any) {
    return Muon.Messages.decode(msg)
  }
}


export class Message {
  type: string
  correlationId?: string
  step: string
  data: any
}
