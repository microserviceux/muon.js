import {Message, MuonClient} from "./MuonClient";


export default class WsDiscovery {

  private servicesNames: Array<string>

  constructor(readonly muon: MuonClient) {}

  handleDiscoveryMessage(message: Message) {
    switch (message.step) {
      case "services": // list of service names

        let data = this.muon.decode(message.data)
        this.servicesNames = data

        console.dir(this.servicesNames)

        break;
      case "refreshservice":    //loading details of a service by tag
        break;
      case "refreshservicetags": //loading details of a service by tags
        break;
      default:
        //unknown
    }
  }

  advertiseLocalService(serviceDescriptor) {

  }

  clearAnnouncements() {

  }

  discoverServices(callback) {
    callback(this.servicesNames.map((name) => {
      return {

      }
    }))
  }

  close() {

  }
}
