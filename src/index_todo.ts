// @ts-nocheck - unported script

class TeslaAccessory {
  latitude: number;
  longitude: number;
  enableHomeLink: boolean | null;

  constructor(log, config) {
    this.latitude = config["latitude"];
    this.longitude = config["longitude"];
    this.disableDoors = config["disableDoors"] || false;
    this.enableHomeLink = config["enableHomeLink"] || false;

    // Optional prefix to prepend to all accessory names.
    const prefix = config["prefix"] ? config["prefix"].trim() + " " : "";

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
}
