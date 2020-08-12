require("@babel/polyfill");
import { ClimateState, Vehicle, VehicleState, VehicleData } from "./util/types";
import { wait } from "./util/wait";
import api from "./util/api";
import { lock } from "./util/mutex";
import callbackify from "./util/callbackify";

const util = require("util");
const tesla = require("teslajs");

let Service: any, Characteristic: any;

export default function(homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  // From config.
  log: Function;
  name: string;
  vin: string;
  username: string | null;
  password: string | null;
  waitMinutes: number;
  authToken: string | null;
  latitude: number;
  longitude: number;
  disableDoors: boolean | null;
  disableTrunk: boolean | null;
  disableFrunk: boolean | null;
  disableChargePort: boolean | null;
  disableClimate: boolean | null;
  disableCharger: boolean | null;
  disableStarter: boolean | null;
  enableHomelink: boolean | null;
  disableChargeLevel: boolean | null;

  // Runtime state.
  vehicleID: string | undefined;

  // Services exposed.
  connectionService: any;
  lockService: any;
  trunkService: any;
  frunkService: any;
  chargePortService: any;
  climateService: any;
  chargerService: any;
  starterService: any;
  homelinkService: any;
  chargeLevelService: any;

  constructor(log, config) {
    const baseName = config["name"];
    this.log = log;
    this.name = baseName + " Vehicle";
    this.vin = config["vin"];
    this.username = config["username"];
    this.password = config["password"];
    this.waitMinutes = config["waitMinutes"] || 1; // default to one minute.
    this.authToken = config["authToken"];
    this.latitude = config["latitude"];
    this.longitude = config["longitude"];
    this.disableDoors = config["disableDoors"] || false;
    this.disableTrunk = config["disableTrunk"] || false;
    this.disableFrunk = config["disableFrunk"] || false;
    this.disableChargePort = config["disableChargePort"] || false;
    this.disableClimate = config["disableClimate"] || false;
    this.disableCharger = config["disableCharger"] || false;
    this.disableStarter = config["disableStarter"] || false;
    this.disableHomelink = config["disableHomelink"] || false;
    this.disableChargeLevel = config["disableChargeLevel"] || false;

    const connectionService = new Service.Switch(
      baseName + " Connection",
      "connection",
    );

    connectionService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getConnectionOn))
      .on("set", callbackify(this.setConnectionOn));

    this.connectionService = connectionService;

    const lockService = new Service.LockMechanism(baseName + " Doors", "doors");

    lockService
      .getCharacteristic(Characteristic.LockCurrentState)
      .on("get", callbackify(this.getLockCurrentState));

    lockService
      .getCharacteristic(Characteristic.LockTargetState)
      .on("get", callbackify(this.getLockTargetState))
      .on("set", callbackify(this.setLockTargetState));

    this.lockService = lockService;

    const climateService = new Service.Switch(baseName + " Climate", "climate");

    climateService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getClimateOn))
      .on("set", callbackify(this.setClimateOn));

    this.climateService = climateService;

    // Enable the rear trunk lock service.
    const trunkService = new Service.LockMechanism(
      baseName + " Trunk",
      "trunk",
    );

    trunkService
      .getCharacteristic(Characteristic.LockCurrentState)
      .on("get", callbackify(this.getTrunkCurrentState));

    trunkService
      .getCharacteristic(Characteristic.LockTargetState)
      .on("get", callbackify(this.getTrunkTargetState))
      .on("set", callbackify(this.setTrunkTargetState));

    this.trunkService = trunkService;

    // Enable the front trunk lock service.
    const frunkService = new Service.LockMechanism(
      baseName + " Front Trunk",
      "frunk",
    );

    frunkService
      .getCharacteristic(Characteristic.LockCurrentState)
      .on("get", callbackify(this.getFrunkCurrentState));

    frunkService
      .getCharacteristic(Characteristic.LockTargetState)
      .on("get", callbackify(this.getFrunkTargetState))
      .on("set", callbackify(this.setFrunkTargetState));

    this.frunkService = frunkService;

    // Enable the charge port lock service; allows you to open/close the charging port.
    const chargePortService = new Service.LockMechanism(
      baseName + " Charge Port",
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
    const chargerService = new Service.Switch(baseName + " Charger", "charger");

    chargerService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getChargerOn))
      .on("set", callbackify(this.setChargerOn));

    this.chargerService = chargerService;

    // Remote start service lets you initiate keyless driving.
    const starterService = new Service.Switch(baseName + " Starter", "starter");

    starterService
      .getCharacteristic(Characteristic.On)
      .on("get", callbackify(this.getStarterOn))
      .on("set", callbackify(this.setStarterOn));

    this.starterService = starterService;

    // Homelink start service lets you open or close a garage door.
    const homelinkService = new Service.GarageDoorOpener(
      baseName + " Homelink",
      "homelink",
    );

    homelinkService
      .getCharacteristic(Characteristic.TargetDoorState)
      .on("get", callbackify(this.getCurrentGarageDoorState))
      .on("set", callbackify(this.setTargetGarageDoorState));

    this.homelinkService = homelinkService;

    // Charge Level
    const chargeLevelService = new Service.BatteryService(
      baseName + " Charge Level",
      "Charge Level",
    );

    chargeLevelService
      .getCharacteristic(Characteristic.BatteryLevel)
      .on("get", callbackify(this.getCurrentChargeLevel));

    this.chargeLevelService = chargeLevelService;
  }

  getServices() {
    return [
      this.connectionService,
      ...(this.disableDoors ? [] : [this.lockService]),
      ...(this.disableClimate ? [] : [this.climateService]),
      ...(this.disableTrunk ? [] : [this.trunkService]),
      ...(this.disableFrunk ? [] : [this.frunkService]),
      ...(this.disableCharger ? [] : [this.chargerService]),
      ...(this.disableChargePort ? [] : [this.chargePortService]),
      ...(this.disableStarter ? [] : [this.starterService]),
      ...(this.enableHomelink ? [] : [this.homelinkService]),
      ...(this.disableChargeLevel ? [] : [this.chargeLevelService]),
    ];
  }

  //
  //Homelink
  //

  getCurrentGarageDoorState = async () => {
    this.log("Homelink does not support garage door status.");
    return;
  };

  setTargetGarageDoorState = async () => {
    const options = await this.getOptions();
    const state: VehicleState = await api("vehicleState", options);

    // Car has to be awake
    await this.wakeUp();

    // This will only succeed if the car is already online and within proximity to the
    // latitude and longitude settings.
    if (state.homelink_nearby) {
      const results = await api(
        "homelink",
        options,
        this.latitude,
        this.longitude,
      );
      this.log("Homelink activated: ", results.result);
    } else this.log("Homelink not available.");
  };

  //
  // Charge Level
  //

  getCurrentChargeLevel = async () => {
    const options = await this.getOptions();
    const chargelevel = await api("chargeState", options);

    return chargelevel.battery_level;
  };

  //
  // Vehicle Lock
  //

  getLockCurrentState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.locked
      ? Characteristic.LockCurrentState.SECURED
      : Characteristic.LockCurrentState.UNSECURED;
  };

  getLockTargetState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.locked
      ? Characteristic.LockTargetState.SECURED
      : Characteristic.LockTargetState.UNSECURED;
  };

  setLockTargetState = async state => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log("Set lock state to", state);

    if (state === Characteristic.LockTargetState.SECURED) {
      await api("doorLock", options);
    } else {
      await api("doorUnlock", options);
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == Characteristic.LockTargetState.SECURED) {
      this.lockService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.SECURED,
      );
    } else {
      this.lockService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
    }
  };

  //
  // Connection Switch
  //

  getConnectionOn = async () => {
    const { state } = await this.getVehicle();
    const on = state === "online";

    this.log("Connection on?", on);
    return on;
  };

  setConnectionOn = async on => {
    if (on) {
      this.log("Waking up vehicle.");
      await this.wakeUp();
    } else {
      this.log("Ignoring request to put vehicle to sleep, we can't do that!");
    }
  };

  //
  // Climate Switch
  //

  getClimateOn = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: ClimateState = await api("climateState", options);

    const on = state.is_climate_on;

    this.log("Climate on?", on);
    return on;
  };

  setClimateOn = async on => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log("Set climate to", on);

    if (on) {
      await api("climateStart", options);
    } else {
      await api("climateStop", options);
    }
  };

  //
  // Rear Trunk
  //

  getTrunkCurrentState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.rt
      ? Characteristic.LockCurrentState.UNSECURED
      : Characteristic.LockCurrentState.SECURED;
  };

  getTrunkTargetState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.rt
      ? Characteristic.LockTargetState.UNSECURED
      : Characteristic.LockTargetState.SECURED;
  };

  setTrunkTargetState = async state => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log("Set trunk state to", state);

    // Now technically we are just "actuating" the state here; if you asked
    // to open the trunk, we will just "actuate" it. On the Model 3, that means
    // pop it no matter what you say - if you say "Close" it'll do nothing.
    // On the Model S/X with power liftgates, if you say "Open" or "Close"
    // it will do the same thing: "actuate" which means to just toggle it.
    await api("openTrunk", options, tesla.TRUNK);

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == Characteristic.LockTargetState.SECURED) {
      this.trunkService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.SECURED,
      );
    } else {
      this.trunkService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
    }
  };

  //
  // Front Trunk
  //

  getFrunkCurrentState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.ft
      ? Characteristic.LockCurrentState.UNSECURED
      : Characteristic.LockCurrentState.SECURED;
  };

  getFrunkTargetState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api("vehicleState", options);

    return state.ft
      ? Characteristic.LockTargetState.UNSECURED
      : Characteristic.LockTargetState.SECURED;
  };

  setFrunkTargetState = async state => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log("Set frunk state to", state);

    if (state === Characteristic.LockTargetState.SECURED) {
      throw new Error("Cannot close an open frunk.");
    } else {
      await api("openTrunk", options, tesla.FRUNK);
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    const { frunkService } = this;

    frunkService &&
      frunkService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
  };

  //
  // Charge Port
  //

  getChargePortCurrentState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    return state.charge_state.charge_port_door_open
      ? Characteristic.LockCurrentState.UNSECURED
      : Characteristic.LockCurrentState.SECURED;
  };

  getChargePortTargetState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    return state.charge_state.charge_port_door_open
      ? Characteristic.LockTargetState.UNSECURED
      : Characteristic.LockTargetState.SECURED;
  };

  setChargePortTargetState = async state => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

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

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    const on = state.charge_state.charging_state === "Charging";

    this.log("Charging?", on);
    return on;
  };

  setChargerOn = async (on: boolean) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

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

    // This will only succeed if the car is already online.
    const state: VehicleData = await api("vehicleData", options);

    const on = !!state.vehicle_state.remote_start;

    this.log("Remote start active?", on);
    return on;
  };

  setStarterOn = async (on: boolean) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log("Set remote starter to", on);

    if (on) {
      await tesla.remoteStartAsync(options, this.password);
    } else {
      throw new Error("Cannot turn off the remote starter.");
    }
  };

  //
  // General
  //

  getOptions = async (): Promise<{ authToken: string; vehicleID: string }> => {
    // Use a mutex to prevent multiple logins happening in parallel.
    const unlock = await lock("getOptions", 20000);

    try {
      // First login if we don't have a token.
      const authToken = await this.getAuthToken();

      // Grab the string ID of your vehicle.
      const { id_s: vehicleID } = await this.getVehicle();

      return { authToken, vehicleID };
    } finally {
      unlock();
    }
  };

  getAuthToken = async (): Promise<string> => {
    const { username, password, authToken } = this;

    // Return cached value if we have one.
    if (authToken) return authToken;

    this.log("Logging into Tesla with username/password…");
    const result = await api("login", username, password);
    const token = result.authToken;

    // Save it in memory for future API calls.
    this.log("Got a login token.");
    this.authToken = token;
    return token;
  };

  getVehicle = async () => {
    const { vin } = this;

    // Only way to do this is to get ALL vehicles then filter out the one
    // we want.
    const authToken = await this.getAuthToken();
    const vehicles: Vehicle[] = await api("vehicles", { authToken });

    // Now figure out which vehicle matches your VIN.
    // `vehicles` is something like:
    // [ { id_s: '18488650400306554', vin: '5YJ3E1EA8JF006024', state: 'asleep', ... }, ... ]
    const vehicle = vehicles.find(v => v.vin === vin);

    if (!vehicle) {
      this.log(
        "No vehicles were found matching the VIN ${vin} entered in your config.json. Available vehicles:",
      );
      for (const vehicle of vehicles) {
        this.log("${vehicle.vin} [${vehicle.display_name}]");
      }

      throw new Error(`Couldn't find vehicle with VIN ${vin}.`);
    }

    this.log(
      `Using vehicle "${vehicle.display_name}" with state "${vehicle.state}"`,
    );

    return vehicle;
  };

  wakeUp = async () => {
    const options = await this.getOptions();

    // Send the command.
    await api("wakeUp", options);

    // Wait up to 30 seconds for the car to wake up.
    const start = Date.now();
    let waitTime = 1000;

    while (Date.now() - start < this.waitMinutes * 60 * 1000) {
      // Poll Tesla for the latest on this vehicle.
      const { state } = await this.getVehicle();

      if (state === "online") {
        // Success!
        return;
      }

      this.log("Waiting for vehicle to wake up...");
      await wait(waitTime);

      // Use exponential backoff with a max wait of 5 seconds.
      waitTime = Math.min(waitTime * 2, 5000);
    }

    throw new Error(
      `Vehicle did not wake up within ${this.waitMinutes} minutes.`,
    );
  };
}
