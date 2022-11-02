import { CharacteristicValue, Service } from "homebridge";
import { VehicleData } from "../util/types";
import { wait } from "../util/wait";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class HomeLinkService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap, tesla } = context;

    const service = new hap.Service.GarageDoorOpener(
      this.serviceName("HomeLink"),
      "homeLink",
    );

    const currentState = service
      .getCharacteristic(hap.Characteristic.CurrentDoorState)
      .on("get", this.createGetter(this.getCurrentState));

    const targetState = service
      .getCharacteristic(hap.Characteristic.TargetDoorState)
      .on("get", this.createGetter(this.getTargetState))
      .on("set", this.createSetter(this.setTargetState));

    this.service = service;

    tesla.on("vehicleDataUpdated", (data) => {
      currentState.updateValue(this.getCurrentState(data));
      targetState.updateValue(this.getTargetState(data));
    });
  }

  getCurrentState(data: VehicleData | null): CharacteristicValue {
    const { hap } = this.context;
    return hap.Characteristic.CurrentDoorState.CLOSED;
  }

  getTargetState(data: VehicleData | null): CharacteristicValue {
    const { hap } = this.context;
    return hap.Characteristic.TargetDoorState.CLOSED;
  }

  async setTargetState(state: number) {
    const { service } = this;
    const { log, tesla, hap } = this.context;
    const { latitude, longitude } = this.context.config;

    await tesla.wakeAndCommand(async (options) => {
      const data = await tesla.getVehicleData();

      if (!data) {
        log("Cannot trigger HomeLink without current vehicle state.");
        return;
      }

      // This will only succeed if the car is already online and within proximity to the
      // latitude and longitude settings.
      if (data.vehicle_state.homelink_nearby) {
        const results = await tesla.api(
          "homelink",
          options,
          latitude,
          longitude,
        );
        log("HomeLink activated: ", results.result);
      } else {
        log("HomeLink not available; vehicle reports not nearby.");
      }
    });

    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == hap.Characteristic.TargetDoorState.CLOSED) {
      service.setCharacteristic(
        hap.Characteristic.CurrentDoorState,
        hap.Characteristic.CurrentDoorState.CLOSED,
      );
    } else {
      service.setCharacteristic(
        hap.Characteristic.CurrentDoorState,
        hap.Characteristic.CurrentDoorState.OPEN,
      );
    }
  }
}
