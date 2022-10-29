import { Service } from "homebridge";
import { wait } from "../util/wait";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

export class VehicleLockService extends TeslaPluginService {
  service: Service;

  constructor(context: TeslaPluginServiceContext) {
    super(context);
    const { hap } = context;

    const service = new hap.Service.LockMechanism(
      this.serviceName("Car Doors"),
      "carDoors",
    );

    service
      .getCharacteristic(hap.Characteristic.LockCurrentState)
      .on("get", this.createGetter(this.getCurrentState));

    service
      .getCharacteristic(hap.Characteristic.LockTargetState)
      .on("get", this.createGetter(this.getTargetState))
      .on("set", this.createSetter(this.setTargetState));

    this.service = service;
  }

  async getCurrentState() {
    const { log, tesla, hap } = this.context;

    const data = await tesla.getVehicleData();

    // Assume locked when not connected.
    const locked = data ? data.vehicle_state.locked : true;

    // log("Get vehicle locked:", locked);

    return locked
      ? hap.Characteristic.LockCurrentState.SECURED
      : hap.Characteristic.LockCurrentState.UNSECURED;
  }

  async getTargetState() {
    const { log, tesla, hap } = this.context;

    const data = await tesla.getVehicleData();

    // Assume locked when not connected.
    const locked = data ? data.vehicle_state.locked : true;

    // log("Get vehicle locking:", locked);

    return locked
      ? hap.Characteristic.LockTargetState.SECURED
      : hap.Characteristic.LockTargetState.UNSECURED;
  }

  async setTargetState(state: number) {
    const { service } = this;
    const { log, tesla, hap } = this.context;

    const options = await tesla.getOptions();

    const background = async () => {
      // Wake up, this is important!
      await tesla.wakeUp(options);

      const locked = state === hap.Characteristic.LockTargetState.SECURED;

      if (locked) {
        log("Locking vehicle.");
        await tesla.command("doorLock", options);
      } else {
        log("Unlocking vehicle.");
        await tesla.command("doorUnlock", options);
      }
    };

    // Don't wait for this to finish, just return immediately.
    background();

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
