import { CharacteristicValue, Service } from "homebridge";
import { VehicleData } from "../util/types";
import { wait } from "../util/wait";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./TeslaPluginService";

const teslajs = require("teslajs");

export type Trunk = {
  name: string; // Like "Front Trunk"
  subtype: string; // Like "frontTrunk"
  apiName: any;
};

export const FrontTrunk: Trunk = {
  name: "Front Trunk",
  subtype: "frontTrunk",
  apiName: teslajs.FRUNK,
};

export const RearTrunk: Trunk = {
  name: "Trunk",
  subtype: "trunk",
  apiName: teslajs.TRUNK,
};

export class TrunkService extends TeslaPluginService {
  trunk: Trunk;
  service: Service;

  constructor(trunk: Trunk, context: TeslaPluginServiceContext) {
    super(context, trunk.name);
    this.trunk = trunk;

    const { hap, tesla } = context;

    const service = new hap.Service.LockMechanism(
      this.serviceName,
      trunk.subtype,
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

    // Assume closed when not connected.
    const opened = data ? !!data.vehicle_state.rt : false;

    return opened
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
    const { name, apiName } = this.trunk;

    await tesla.wakeAndCommand(async (options) => {
      const opening = state === hap.Characteristic.LockTargetState.UNSECURED;

      log(`${opening ? "Opening" : "Closing"} the ${name}…`);

      // Wake up, this is important!
      await tesla.wakeUp(options);

      log(`Actuating the ${name}.`);

      // Now technically we are just "actuating" the state here; if you asked
      // to open the trunk, we will just "actuate" it. On the Model 3, that means
      // pop it no matter what you say - if you say "Close" it'll do nothing.
      // On the models with power liftgates, if you say "Open" or "Close"
      // it will do the same thing: "actuate" which means to just toggle it.
      await tesla.api("openTrunk", options, apiName);
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
