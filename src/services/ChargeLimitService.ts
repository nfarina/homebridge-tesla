import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ChargeLimitService extends TeslaPluginService {
  service: Service;

  // We need to set charge limit on a delay because the UX in the Home app is
  // a lightbulb brightness slider that is "realtime" - so we will be told
  // to change the charge level even as the user is dragging the slider around.
  // We don't want to issue a million API commands so we'll wait a bit before
  // actually sending the command.
  setLimitTimeoutId: NodeJS.Timeout | null = null;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.Lightbulb(
      this.serviceName("Charge Limit"),
      "chargeLimit",
    );

    const on = service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn));

    const brightness = service
      .addCharacteristic(hap.Characteristic.Brightness)
      .on("get", this.createGetter(this.getLevel))
      .on("set", this.createSetter(this.setLevel));

    this.service = service;

    tesla.on("vehicleDataUpdated", (data) => {
      on.updateValue(this.getOn(data));
      brightness.updateValue(this.getLevel(data));
    });
  }

  getOn(data: VehicleData | null) {
    // Show off when not connected and no last-known state. Otherwise always
    // "on".
    return data ? true : false;
  }

  getLevel(data: VehicleData | null) {
    // Show 0% when not connected and no last-known state.
    return data ? data.charge_state.charge_limit_soc : 0;
  }

  async setLevel(value: number) {
    if (this.setLimitTimeoutId) {
      clearTimeout(this.setLimitTimeoutId);
    }

    // Set it in 5 seconds.
    this.setLimitTimeoutId = setTimeout(() => {
      this.actuallySetLevel(value);
    }, 3000);
  }

  async actuallySetLevel(value: number) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      log(`Setting charge limit to ${value}…`);
      await tesla.api("setChargeLimit", options, value);
    });
  }
}
