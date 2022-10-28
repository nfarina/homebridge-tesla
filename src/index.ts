require("@babel/polyfill");
import { AccessoryConfig, API, HAP, Logging } from "homebridge";
import { ConnectionService } from "./services/ConnectionService";
import {
  TeslaPluginService,
  TeslaPluginServiceContext,
} from "./services/TeslaPluginService";
import { FrontTrunk, RearTrunk, TrunkService } from "./services/TrunkService";
import { VehicleLockService } from "./services/VehicleLockService";
import { TeslaApi } from "./util/api";
import { TeslaPluginConfig } from "./util/types";

let hap: HAP;

export default function (api: API) {
  hap = api.hap;
  api.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  log: Logging;
  name: string;
  tesla: TeslaApi;

  // Services exposed.
  services: TeslaPluginService[] = [];

  constructor(log: Logging, untypedConfig: AccessoryConfig) {
    const config: TeslaPluginConfig = untypedConfig as any;
    const tesla = new TeslaApi(log, config);

    this.log = log;
    this.name = config.name;
    this.tesla = tesla;

    // Create a new service for each feature.
    const context: TeslaPluginServiceContext = { log, hap, config, tesla };

    this.services.push(new ConnectionService(context));

    if (config.vehicleLock ?? true) {
      this.services.push(new VehicleLockService(context));
    }

    if (config.trunk ?? true) {
      this.services.push(new TrunkService(RearTrunk, context));
    }

    if (config.frontTrunk ?? true) {
      this.services.push(new TrunkService(FrontTrunk, context));
    }
  }

  getServices() {
    return this.services.map((service) => service.service);
  }
}
