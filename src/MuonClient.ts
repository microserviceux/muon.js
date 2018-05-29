import * as WebSocket from "ws";
import * as BrowserWebsocket from "browser-websocket";
import * as Muon from "muon-core"
import WsDiscovery from "./WsDiscovery";
import WsTransport from "./WsTransport";


export async function client(conf: MuonConf): Promise<any> {

  if (conf.url == null) {
    conf.url = "wss://ws.muoncore.io"
  }

  let ws = new WebSocketProxy(conf)
  await ws.connect()
  console.log("CONNECTING TO " + conf.url)

  return new MuonClient(ws, conf).muon()
}


export class WebSocketProxy {

  private ws: any
  private msgcallback: (msg: Message) => void
  private connectcallback: () => void


  constructor(readonly conf: MuonConf) {}

  connect(): Promise<void> {
    return new Promise(res => {
      try {
        let p = process as any

        if (p.browser) {
          this.ws = new BrowserWebsocket(this.conf.url)
        } else {
          this.ws = new WebSocket(this.conf.url) as any
        }

        this.ws.on("close", () => {
          console.log("WS Closed, reconnecting")
          setTimeout(() => {
            this.connect()
          }, 200)
        })

        this.ws.on("error", () => {
          // eaten, will auto reconnect on close.
        })

        this.ws.on("open", () => {
          console.log("Connected to ws")
          this.setupCallback()
          if (this.connectcallback != null) {
            this.connectcallback()
          }
          res()
        })
      } catch (e) {
        console.log("Failed during ws init, back off connection")
        setTimeout(() => {
          this.connect()
        }, 200)
      }
    })
  }

  onreconnect(exec:() => void) {
    this.connectcallback = exec
  }

  onmessage(exec:(msg: Message) => void) {
    this.msgcallback = exec
    this.setupCallback()
  }

  close() {
    this.ws.close()
  }

  private setupCallback() {
    if (this.ws != null && this.msgcallback !=  null) {
      this.ws.on("message", (ev) => {
        let msg: Message
        const p = process as any
        if (p.browser) {
          msg = JSON.parse(ev.data);
        } else {
          msg = JSON.parse(ev.toString());
        }

        this.msgcallback(msg)
      })
    }
  }

  send(message: Message) {
    const p = process as any
    if (p.browser) {
      this.ws.emit(JSON.stringify(message))
    } else {
      this.ws.send(JSON.stringify(message))
    }
  }
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

  constructor(readonly ws: WebSocketProxy, readonly conf: MuonConf) {
    this.discovery = new WsDiscovery(this)
    this.transport = new WsTransport(this)

    ws.onmessage((ev) => {
      if (ev.type == "discovery") {
        this.discovery.handleDiscoveryMessage(ev)
      } else {
        this.transport.handleTransportMessage(ev)
      }
    })

    ws.onreconnect(() => {
      this.discovery.doAdvertise()

      //TODO, break the channels?

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
    this.ws.send(message)
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
