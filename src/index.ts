require("@babel/polyfill");
import { AccessoryConfig, API, HAP, Logging } from "homebridge";
import { schema } from "../config.schema.json";
import { BatteryService } from "./services/BatteryService";
import { ChargeLimitService } from "./services/ChargeLimitService";
import { ConnectionService } from "./services/ConnectionService";
import { SentryModeService } from "./services/SentryModeService";
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
    tesla.getVehicleData();

    // Create a new service for each feature.
    const context: TeslaPluginServiceContext = { log, hap, config, tesla };

    this.services.push(new ConnectionService(context));
    this.services.push(new BatteryService(context));

    const { properties } = schema;

    if (config.vehicleLock ?? properties.vehicleLock.default) {
      this.services.push(new VehicleLockService(context));
    }

    if (config.trunk ?? properties.trunk.default) {
      this.services.push(new TrunkService(RearTrunk, context));
    }

    if (config.frontTrunk ?? properties.frontTrunk.default) {
      this.services.push(new TrunkService(FrontTrunk, context));
    }

    if (config.sentryMode ?? properties.sentryMode.default) {
      this.services.push(new SentryModeService(context));
    }

    if (config.chargeLimit ?? properties.chargeLimit.default) {
      this.services.push(new ChargeLimitService(context));
    }
  }

  getServices() {
    return this.services.map((service) => service.service);
  }
}
