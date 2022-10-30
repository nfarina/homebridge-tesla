// @ts-nocheck - unported script

class TeslaAccessory {
  latitude: number;
  longitude: number;
  disableDoors: boolean | null;
  disableChargePort: boolean | null;
  disableCharger: boolean | null;
  disableStarter: boolean | null;
  enableHomeLink: boolean | null;

  constructor(log, config) {
    this.latitude = config["latitude"];
    this.longitude = config["longitude"];
    this.disableDoors = config["disableDoors"] || false;
    this.disableChargePort = config["disableChargePort"] || false;
    this.disableCharger = config["disableCharger"] || false;
    this.disableStarter = config["disableStarter"] || false;
    this.enableHomeLink = config["enableHomeLink"] || false;

    // Optional prefix to prepend to all accessory names.
    const prefix = config["prefix"] ? config["prefix"].trim() + " " : "";

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
