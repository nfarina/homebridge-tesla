// @ts-nocheck - unported script
require("@babel/polyfill");
import api from "./util/api";
import callbackify from "./util/callbackify";
import { ClimateState, VehicleData, VehicleState } from "./util/types";
import { wait } from "./util/wait";

const util = require("util");
const tesla = require("teslajs");

let Service: any, Characteristic: any;

export default function (homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  // From config.
  log: Function;
  name: string;
  vin: string;
  refreshToken: string;
  password: string;
  waitMinutes: number;
  latitude: number;
  longitude: number;
  disableDoors: boolean | null;
  disableChargePort: boolean | null;
  disableClimate: boolean | null;
  disableDefrost: boolean | null;
  disableCharger: boolean | null;
  disableStarter: boolean | null;
  enableHomeLink: boolean | null;
  disableChargeLevel: boolean | null;

  // Runtime state.
  authToken: string | undefined;
  authTokenExpires: number | undefined;
  authTokenError: Error | undefined;

  // Services exposed.
  lockService: any;
  chargePortService: any;
  climateService: any;
  defrostService: any;
  chargerService: any;
  starterService: any;
  homelinkService: any;
  chargeLevelService: any;

  constructor(log, config) {
    this.log = log;
    this.name = config["name"];
    this.vin = config["vin"];
    this.waitMinutes = config["waitMinutes"] || 1; // default to one minute.
    this.refreshToken = config["refreshToken"];
    this.password = config["password"];
    this.latitude = config["latitude"];
    this.longitude = config["longitude"];
    this.disableDoors = config["disableDoors"] || false;
    this.disableChargePort = config["disableChargePort"] || false;
    this.disableClimate = config["disableClimate"] || false;
    this.disableDefrost =
      this.disableClimate || config["disableDefrost"] || false;
    this.disableCharger = config["disableCharger"] || false;
    this.disableStarter = config["disableStarter"] || false;
    this.enableHomeLink = config["enableHomeLink"] || false;
    this.disableChargeLevel = config["disableChargeLevel"] || false;

    // Optional prefix to prepend to all accessory names.
    const prefix = config["prefix"] ? config["prefix"].trim() + " " : "";

    const climateService = new Service.Switch(prefix + "Climate", "climate");

    climateService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getClimateOn))
      .on("set", callbackify(this.setClimateOn));

    this.climateService = climateService;

    const defrostService = new Service.Switch(prefix + "Defrost", "defrost");

    defrostService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getDefrostOn))
      .on("set", callbackify(this.setDefrostOn));

    this.defrostService = defrostService;

    // Enable the charge port lock service; allows you to open/close the charging port.
    const chargePortService = new Service.LockMechanism(
      prefix + "Charge Port",
      "chargePort",
    );

    chargePortService
      .getCharacteristic(Characteristic.LockCurrentState)
      .on("get", callbackify(this.getChargePortCurrentState));

    chargePortService
      .getCharacteristic(Characteristic.LockTargetState)
      .on("get", callbackify(this.getChargePortTargetState))
      .on("set", callbackify(this.setChargePortTargetState));

    this.chargePortService = chargePortService;

    // Enable the charger service; allows you to turn on/off car charging.
    const chargerService = new Service.Switch(prefix + "Charger", "charger");

    chargerService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getChargerOn))
      .on("set", callbackify(this.setChargerOn));

    this.chargerService = chargerService;

    // Remote start service lets you initiate keyless driving.
    const starterService = new Service.Switch(prefix + "Starter", "starter");

    starterService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getStarterOn))
      .on("set", callbackify(this.setStarterOn));

    this.starterService = starterService;

    // HomeLink start service lets you open or close a garage door.
    const homelinkService = new Service.GarageDoorOpener(
      prefix + "HomeLink",
      "homelink",
    );

    homelinkService
      .getCharacteristic(Characteristic.TargetDoorState)
      .on("get", callbackify(this.getCurrentGarageDoorState))
      .on("set", callbackify(this.setTargetGarageDoorState));

    this.homelinkService = homelinkService;
  }

  getServices() {
    return [
      ...(this.disableClimate ? [] : [this.climateService]),
      ...(this.disableDefrost ? [] : [this.defrostService]),
      ...(this.disableCharger ? [] : [this.chargerService]),
      ...(this.disableChargePort ? [] : [this.chargePortService]),
      ...(this.disableStarter ? [] : [this.starterService]),
      ...(!this.enableHomeLink ? [] : [this.homelinkService]),
    ];
  }

  //
  // HomeLink
  //

  getCurrentGarageDoorState = async () => {
    this.log("HomeLink does not support garage door status.");
    this.log("Always setting garage door state to closed.");

    if (!this.homelinkService.Characteristic.TargetDoorState) {
      this.homelinkService.setCharacteristic(
        Characteristic.TargetDoorState,
        Characteristic.TargetDoorState.CLOSED,
      );
    }

    return;
  };

  setTargetGarageDoorState = async () => {
    const options = await this.getOptions();
    const state: VehicleState = await api("vehicleState", options);

    // Car has to be awake
    await this.wakeUp(options);

    // This will only succeed if the car is already online and within proximity to the
    // latitude and longitude settings.
    if (state.homelink_nearby) {
      const results = await api(
        "homelink",
        options,
        this.latitude,
        this.longitude,
      );
      this.log("HomeLink activated: ", results.result);
    } else this.log("HomeLink not available.");
  };

  //
  // Climate Switch
  //

  getClimateOn = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("climate state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: ClimateState = await api("climateState", options);

    const on = state.is_climate_on;

    this.log("Climate on?", on);
    return on;
  };

  setClimateOn = async (on) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp(options);

    this.log("Set climate to", on);

    if (on) {
      await api("climateStart", options);
    } else {
      await api("climateStop", options);
    }
  };

  //
  // Defrost Switch
  //

  getDefrostOn = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("defrost state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: ClimateState = await api("climateState", options);

    const on = state.defrost_mode;

    this.log("Defrost on?", !!on);
    return !!on;
  };

  setDefrostOn = async (on) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp(options);

    this.log("Set defrost to", on);

    await api("maxDefrost", options, on);
  };

  //
  // Charge Port
  //

  getChargePortCurrentState = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("charge port current state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    console.log("LATCH STATUS:", state.charge_state.charge_port_latch);
    console.log("DOOR STATUS:", state.charge_state.charge_port_door_open);

    return state.charge_state.charge_port_door_open
      ? Characteristic.LockCurrentState.UNSECURED
      : Characteristic.LockCurrentState.SECURED;
  };

  getChargePortTargetState = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("charge port target state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    return state.charge_state.charge_port_door_open
      ? Characteristic.LockTargetState.UNSECURED
      : Characteristic.LockTargetState.SECURED;
  };

  setChargePortTargetState = async (state) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp(options);

    this.log("Set charge port state to", state);

    if (state === Characteristic.LockTargetState.SECURED) {
      await api("closeChargePort", options);
    } else {
      await api("openChargePort", options);
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == Characteristic.LockTargetState.SECURED) {
      this.chargePortService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.SECURED,
      );
    } else {
      this.chargePortService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
    }
  };

  //
  // Charger Switch
  //

  getChargerOn = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("charger state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    const on = state.charge_state.charging_state === "Charging";

    this.log("Charging?", on);
    return on;
  };

  setChargerOn = async (on: boolean) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp(options);

    this.log("Set charging to", on);

    if (on) {
      await api("startCharge", options);
    } else {
      await api("stopCharge", options);
    }
  };

  //
  // Starter Switch (Remote start)
  //

  getStarterOn = async () => {
    const options = await this.getOptions();

    if (options.isAsleep) {
      this.logIgnored("starter state");
      throw new Error("Vehicle is asleep.");
    }

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    const on = !!state.vehicle_state.remote_start;

    this.log("Remote start active?", on);
    return on;
  };

  setStarterOn = async (on: boolean) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp(options);

    this.log("Set remote starter to", on);

    if (on) {
      await tesla.remoteStartAsync(options, this.password);
    } else {
      throw new Error("Cannot turn off the remote starter.");
    }
  };
}
