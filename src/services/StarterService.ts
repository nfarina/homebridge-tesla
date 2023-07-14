import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class StarterService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context, "Starter");
    const { hap, tesla } = context;

    const service = new hap.Service.Switch(this.serviceName, "starter");

    const on = service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn))
      .on("set", this.createSetter(this.setOn));

    this.service = service;

    tesla.on("vehicleDataUpdated", (data) => {
      on.updateValue(this.getOn(data));
    });
  }

  getOn(data: VehicleData | null) {
    // Assume off when not connected.
    return data ? !!data.vehicle_state.remote_start : false;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      if (on) {
        log("Enabling keyless driving.");
        await tesla.api("remoteStart", options);
      } else {
        log("Keyless driving cannot be disabled; ignoring.");
      }
    });
  }
}
