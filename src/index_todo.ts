// @ts-nocheck - unported script

class TeslaAccessory {
  latitude: number;
  longitude: number;
  disableStarter: boolean | null;
  enableHomeLink: boolean | null;

  constructor(log, config) {
    this.latitude = config["latitude"];
    this.longitude = config["longitude"];
    this.disableDoors = config["disableDoors"] || false;
    this.disableStarter = config["disableStarter"] || false;
    this.enableHomeLink = config["enableHomeLink"] || false;

    // Optional prefix to prepend to all accessory names.
    const prefix = config["prefix"] ? config["prefix"].trim() + " " : "";

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
