import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class BatteryLevelService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.Lightbulb(
      this.serviceName("Battery Level"),
      "batteryLevel",
    );

    const on = service
      .getCharacteristic(hap.Characteristic.On)
      .on("get", this.createGetter(this.getOn));

    const brightness = service
      .addCharacteristic(hap.Characteristic.Brightness)
      .on("get", this.createGetter(this.getLevel));

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
    // Assume 50% when not connected and no last-known state.
    return data ? data.charge_state.battery_level : 50;
  }
}
