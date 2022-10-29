import { Service } from "homebridge";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ConnectionService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap } = context;

    const service = new hap.Service.Switch(
      this.serviceName("Connection"),
      "connection",
    );

    service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn))
      .on("set", this.createSetter(this.setOn));

    this.service = service;
  }

  async getOn() {
    const { tesla } = this.context;

    const { state } = await tesla.getVehicle();
    const on = state === "online";

    return on;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    if (on) {
      log("Waking up vehicle.");
      const options = await tesla.getOptions();
      await tesla.wakeUp(options);
    } else {
      log("Ignoring request to put vehicle to sleep, we can't do that!");
    }
  }
}
