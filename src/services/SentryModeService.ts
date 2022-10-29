import { Service } from "homebridge";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class SentryModeService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap } = context;

    const service = new hap.Service.Switch(
      this.serviceName("Sentry Mode"),
      "sentryMode",
    );

    service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn))
      .on("set", this.createSetter(this.setOn));

    this.service = service;
  }

  async getOn() {
    const { tesla } = this.context;

    const data = await tesla.getVehicleData();

    // Assume off when not connected.
    const on = data ? data.vehicle_state.sentry_mode : false;

    return on;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    const options = await tesla.getOptions();

    const background = async () => {
      // Wake up, this is important!
      await tesla.wakeUp(options);

      if (on) {
        log("Enabling Sentry Mode.");
        await tesla.command("setSentryMode", options, true);
      } else {
        log("Disabling Sentry Mode.");
        await tesla.command("setSentryMode", options, false);
      }
    };

    // Don't wait for this to finish, just return immediately.
    background();
  }
}
