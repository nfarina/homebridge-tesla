require("@babel/polyfill");
import { AccessoryConfig, API, Logging } from "homebridge";
import { ConnectionService } from "./services/ConnectionService";
import { TeslaPluginService } from "./services/TeslaPluginService";
import { TeslaApi } from "./util/api";
import { TeslaPluginConfig } from "./util/types";

export default function (api: API) {
  api.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  log: Logging;
  name: string;
  tesla: TeslaApi;

  // Services exposed.
  services: TeslaPluginService[] = [];

  constructor(log: Logging, untypedConfig: AccessoryConfig, api: API) {
    const config: TeslaPluginConfig = untypedConfig as any;

    this.log = log;
    this.name = config.name;
    this.tesla = new TeslaApi(log, config);

    // Create a new service for each feature.
    const args = [log, config, api, this.tesla] as const;

    this.services.push(new ConnectionService(...args));
  }

  getServices() {
    return this.services.map((service) => service.apiService);
  }
}
