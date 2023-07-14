import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class SentryModeService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context, "Sentry Mode");
    const { hap, tesla } = context;

    const service = new hap.Service.Switch(this.serviceName, "sentryMode");

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
    return data ? data.vehicle_state.sentry_mode : false;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      if (on) {
        log("Enabling Sentry Mode.");
        await tesla.api("setSentryMode", options, true);
      } else {
        log("Disabling Sentry Mode.");
        await tesla.api("setSentryMode", options, false);
      }
    });
  }
}
