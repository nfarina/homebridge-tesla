import { Service } from "homebridge";
import { TeslaPluginService } from "./TeslaPluginService";

export class ConnectionService extends TeslaPluginService {
  createService(): Service {
    const { hap } = this;

    const service = new hap.Service.Switch(
      this.serviceName("Connection"),
      "connection",
    );

    service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn))
      .on("set", this.createSetter(this.setOn));

    return service;
  }

  on: boolean = false;

  async getOn() {
    const { log, tesla } = this;

    const { state } = await tesla.getVehicle();
    const on = state === "online";

    log("Connection on?", on);
    return on;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this;

    if (on) {
      log("Waking up vehicle.");
      const options = await tesla.getOptions();
      await tesla.wakeUp(options);
      this.on = true;
    } else {
      log("Ignoring request to put vehicle to sleep, we can't do that!");
    }
  }
}
