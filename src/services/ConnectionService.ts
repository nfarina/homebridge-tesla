import { Service } from "homebridge";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ConnectionService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context, "Connection");
    const { hap } = context;

    const service = new hap.Service.Switch(this.serviceName, "connection");

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
      const options = await tesla.getOptions();
      await tesla.wakeUp(options);

      // Force a refresh of the vehicle data which will cause all services
      // to update HomeKit with the latest state.
      await tesla.getVehicleData({ ignoreCache: true });
    } else {
      log("Ignoring request to put vehicle to sleep, we can't do that!");
    }
  }
}
