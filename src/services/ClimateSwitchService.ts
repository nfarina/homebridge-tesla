import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ClimateSwitchService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context, "Climate");
    const { config, hap, tesla } = context;

    const service = new hap.Service.Switch(this.serviceName, "climate");

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
    return data?.climate_state?.is_climate_on ?? false;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      if (on) {
        log("Turning on climate control…");
        await tesla.api("climateStart", options);
      } else {
        log("Turning off climate control…");
        await tesla.api("climateStop", options);
      }
    });
  }
}
