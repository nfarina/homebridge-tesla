import { CharacteristicValue, Service } from "homebridge";
import { VehicleData } from "../util/types";
import { wait } from "../util/wait";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class ChargePortService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context, "Charge Port");
    const { hap, tesla } = context;

    const service = new hap.Service.LockMechanism(
      this.serviceName,
      "chargePort",
    );

    const currentState = service
      .getCharacteristic(hap.Characteristic.LockCurrentState)
      .on("get", this.createGetter(this.getCurrentState));

    const targetState = service
      .getCharacteristic(hap.Characteristic.LockTargetState)
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

    // Assume locked when not connected.
    const open = data
      ? data.charge_state.charge_port_latch === "Disengaged"
      : false;

    return open
      ? hap.Characteristic.LockCurrentState.UNSECURED
      : hap.Characteristic.LockCurrentState.SECURED;
  }

  getTargetState(data: VehicleData | null): CharacteristicValue {
    const { hap } = this.context;

    const currentState = this.getCurrentState(data);

    return currentState === hap.Characteristic.LockCurrentState.SECURED
      ? hap.Characteristic.LockTargetState.SECURED
      : hap.Characteristic.LockTargetState.UNSECURED;
  }

  async setTargetState(state: number) {
    const { service } = this;
    const { log, tesla, hap } = this.context;

    await tesla.wakeAndCommand(async (options) => {
      const open = state === hap.Characteristic.LockTargetState.UNSECURED;

      if (open) {
        log("Opening charge port.");
        await tesla.api("openChargePort", options);
      } else {
        log("Closing charge port.");
        await tesla.api("closeChargePort", options);
      }
    });

    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == hap.Characteristic.LockTargetState.SECURED) {
      service.setCharacteristic(
        hap.Characteristic.LockCurrentState,
        hap.Characteristic.LockCurrentState.SECURED,
      );
    } else {
      service.setCharacteristic(
        hap.Characteristic.LockCurrentState,
        hap.Characteristic.LockCurrentState.UNSECURED,
      );
    }
  }
}
