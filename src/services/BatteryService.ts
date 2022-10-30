import { Service } from "homebridge";
import { VehicleData } from "../util/types";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class BatteryService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.BatteryService(
      this.serviceName("Battery"),
      "battery",
    );

    const batteryLevel = service
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on("get", this.createGetter(this.getLevel));

    const chargingState = service
      .getCharacteristic(hap.Characteristic.ChargingState)
      .on("get", this.createGetter(this.getChargingState));

    const lowBattery = service
      .getCharacteristic(hap.Characteristic.StatusLowBattery)
      .on("get", this.createGetter(this.getLowBattery));

    this.service = service;

    tesla.on("vehicleDataUpdated", (data) => {
      batteryLevel.updateValue(this.getLevel(data));
      chargingState.updateValue(this.getChargingState(data));
      lowBattery.updateValue(this.getLowBattery(data));
    });
  }

  getLevel(data: VehicleData | null): number {
    // Assume 50% when not connected and no last-known state.
    return data ? data.charge_state.battery_level : 50;
  }

  getChargingState(data: VehicleData | null): number {
    const { hap } = this.context;

    if (data) {
      return data.charge_state.charging_state === "Charging"
        ? hap.Characteristic.ChargingState.CHARGING
        : hap.Characteristic.ChargingState.NOT_CHARGING;
    } else {
      // Assume not charging when not connected and no last-known state.
      return hap.Characteristic.ChargingState.NOT_CHARGING;
    }
  }

  getLowBattery(data: VehicleData | null): boolean {
    // Assume normal battery when not connected and no last-known state.
    return data ? data.charge_state.battery_level <= 20 : false;
  }
}
