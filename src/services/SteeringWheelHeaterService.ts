import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class SteeringWheelHeaterService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.Switch(
      this.serviceName("Steering Wheel Heater"),
      "steeringWheelHeater",
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
    return data ? !!data.climate_state.steering_wheel_heater : false;
  }

  async setOn(on: boolean) {
    const { log, tesla } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      if (on) {
        // The wheel heater only turns on if the climate is on.
        log("Turning on climate control…");
        await tesla.api("climateStart", options);
      }

      log(`Turning steering wheel heater ${on ? "on" : "off"}.`);
      await tesla.api("steeringHeater", options, on);
    });
  }
}
