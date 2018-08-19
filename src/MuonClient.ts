import * as WebSocket from "ws";
import * as BrowserWebsocket from "browser-websocket";
import * as Muon from "muon-core"
import WsDiscovery from "./WsDiscovery";
import WsTransport from "./WsTransport";
import log from "./log";


export async function client(conf: MuonConf): Promise<any> {

  if (conf.url == null) {
    conf.url = "wss://ws.muoncore.io"
  }

  let ws = new WebSocketProxy(conf)
  await ws.connect()
  log.info("now connected!")
  return new MuonClient(ws, conf).muon()
}


export class WebSocketProxy {

  private ws: any
  private msgcallback: (msg: Message) => void
  private connectcallback: () => void
  private backoffVal = 200

  constructor(readonly conf: MuonConf) {}

  backoff(): number {
    let back = this.backoffVal
    if (this.backoffVal < 6000) {
      this.backoffVal *= 2
    }
    return back
  }

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
          let back = this.backoff()
          log.info(`WS Closed, reconnecting in ${back}ms`)
          setTimeout(() => {
            this.connect().then(res)
          }, back)
        })

        this.ws.on("error", () => {
          // eaten, will auto reconnect on close.
        })

        this.ws.on("open", () => {
          log.info("Connected to ws")
          this.backoffVal = 200
          this.setupCallback()
          if (this.connectcallback != null) {
            this.connectcallback()
          }
          res()
        })
      } catch (e) {
        log.info("Failed during ws init, back off connection")
        log.info(e)
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
      } else if (ev.type == "transport") {
        this.transport.handleTransportMessage(ev)
      }
    })

    ws.onreconnect(() => {
      log.info("Reconnected, advertising?")
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
      shutdown: () => {
        log.info("Muon Client Shutdown")
        this.shutdown()
      },
      client: this
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
    // log.info("Error callback passed into browser transport, this is not currently used and will be ignored")
    // upstreamCallback = cb;
  }

  shutdown() {
    this.close();
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
