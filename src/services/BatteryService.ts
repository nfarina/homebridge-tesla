import { Service } from "homebridge";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class BatteryService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap } = context;

    const service = new hap.Service.BatteryService(
      this.serviceName("Battery"),
      "battery",
    );

    service
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on("get", this.createGetter(this.getLevel));

    service
      .getCharacteristic(hap.Characteristic.ChargingState)
      .on("get", this.createGetter(this.getChargingState));

    service
      .getCharacteristic(hap.Characteristic.StatusLowBattery)
      .on("get", this.createGetter(this.getLowBattery));

    this.service = service;
  }

  async getLevel() {
    const { tesla } = this.context;

    const data = await tesla.getVehicleData();

    // Assume 0% when not connected and no last-known state.
    return data ? data.charge_state.battery_level : 0;
  }

  async getChargingState() {
    const { tesla, hap } = this.context;

    const data = await tesla.getVehicleData();

    // Assume not charging when not connected and no last-known state.
    const charging = data
      ? data.charge_state.charging_state === "Charging"
      : hap.Characteristic.ChargingState.NOT_CHARGING;

    return charging;
  }

  async getLowBattery() {
    const { tesla } = this.context;

    const data = await tesla.getVehicleData();

    // Assume low battery when not connected and no last-known state.
    return data ? data.charge_state.battery_level <= 20 : true;
  }
}
