import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ChargerService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.Switch(
      this.serviceName("Charger"),
      "charger",
    );

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
    return data ? data.charge_state.charging_state === "Charging" : false;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      if (on) {
        log("Beginning charging.");
        await tesla.api("startCharge", options);
      } else {
        log("Stopping charging.");
        await tesla.api("stopCharge", options);
      }
    });
  }
}
