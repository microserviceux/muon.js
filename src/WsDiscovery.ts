import {Message, MuonClient} from "./MuonClient";


export default class WsDiscovery {

  private localService: ServiceDescriptor

  private servicesNames: Array<string>
  private serviceInfo: Map<string, ServiceDescriptor> = new Map()

  constructor(readonly muon: MuonClient) {}

  handleDiscoveryMessage(message: Message) {
    switch (message.step) {
      case "services": // list of service names

        let data = this.muon.decode(message.data)
        this.servicesNames = data

        break;
      case "refreshservice":    //loading details of a service by tag

        let descriptor = this.muon.decode(message.data)
        this.serviceInfo.set(descriptor.identifier, descriptor)
        // this.serviceInfo.get()
        //todo, save the new service info into the local cache

        break;
      case "refreshservicetags": //loading details of a service by tags
        //not currently used
        break;
      default:
        //unknown
    }
  }

  advertiseLocalService(serviceDescriptor: ServiceDescriptor) {
    this.localService = serviceDescriptor
    this.doAdvertise()
  }

  doAdvertise() {
    this.muon.send({
      type: "discovery",
      step: "advertise",
      data: this.muon.encode(this.localService)
    })
  }

  clearAnnouncements() {

  }

  discoverServices(callback) {
    if (this.servicesNames != null) {

      if (this.serviceInfo.size == this.servicesNames.length) {
        callback(new Disco(Array.from(this.serviceInfo.values())))
      } else {
        setTimeout(() => {
          this.discoverServices(callback)
        }, 10)
      }
    } else {
      setTimeout(() => {
        this.discoverServices(callback)
      }, 10)
    }
  }

  close() {

  }
}


class Disco {

  constructor(readonly serviceList) {}

  async findServiceWithTags(tags): Promise<ServiceDescriptor[]> {      7
    // this is now a promise. make it work?

    //TODO, this would work much better as a Promise. requires the interface in muon core to be updated to match that.
    return this.serviceList.find((svc) => {
      let matchingTags = svc.tags.filter((tag) => {
        return tags.indexOf(tag) >= 0
      })
      return matchingTags.length == tags.length
    })
  }
}

export class ServiceDescriptor {
  identifier: string;
  tags: Array<string>;
  codecs: Array<string>;
  connectionUrls: Array<string>;
  capabilities: Array<string>;
}

export class InstanceDescriptor {
  instanceId: string;
  identifier: string;
  tags: Array<string>;
  codecs: Array<string>;
  connectionUrls: Array<string>;
  capabilities: Array<string>;
}
