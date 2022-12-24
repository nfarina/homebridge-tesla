require("@babel/polyfill");
import { AccessoryConfig, API, HAP, Logging } from "homebridge";
import { BatteryService } from "./services/BatteryService";
import { ChargeLimitService } from "./services/ChargeLimitService";
import { ChargePortService } from "./services/ChargePortServices";
import { ChargerService } from "./services/ChargerService";
import { ClimateService } from "./services/ClimateService";
import { ClimateSwitchService } from "./services/ClimateSwitchService";
import { ConnectionService } from "./services/ConnectionService";
import { DefrostService } from "./services/DefrostService";
import { HomeLinkService } from "./services/HomeLinkService";
import { SentryModeService } from "./services/SentryModeService";
import { StarterService } from "./services/StarterService";
import { SteeringWheelHeaterService } from "./services/SteeringWheelHeaterService";
import {
  TeslaPluginService,
  TeslaPluginServiceContext
} from "./services/TeslaPluginService";
import { FrontTrunk, RearTrunk, TrunkService } from "./services/TrunkService";
import { VehicleLockService } from "./services/VehicleLockService";
import { TeslaApi } from "./util/api";
import { getConfigValue, TeslaPluginConfig } from "./util/types";

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

    if (getConfigValue(config, "vehicleLock")) {
      this.services.push(new VehicleLockService(context));
    }

    if (getConfigValue(config, "trunk")) {
      this.services.push(new TrunkService(RearTrunk, context));
    }

    if (getConfigValue(config, "frontTrunk")) {
      this.services.push(new TrunkService(FrontTrunk, context));
    }

    if (getConfigValue(config, "climate")) {
      if (getConfigValue(config, "climateSwitch")) {
        this.services.push(new ClimateSwitchService(context));
      } else {
        this.services.push(new ClimateService(context));
      }
    }

    if (getConfigValue(config, "steeringWheelHeater")) {
      this.services.push(new SteeringWheelHeaterService(context));
    }

    if (getConfigValue(config, "chargeLimit")) {
      this.services.push(new ChargeLimitService(context));
    }

    if (getConfigValue(config, "chargePort")) {
      this.services.push(new ChargePortService(context));
    }

    if (getConfigValue(config, "charger")) {
      this.services.push(new ChargerService(context));
    }

    if (getConfigValue(config, "chargingAmps")) {
      this.services.push(new ChargingAmpsService(context));
    }

    if (getConfigValue(config, "defrost")) {
      this.services.push(new DefrostService(context));
    }

    if (getConfigValue(config, "sentryMode")) {
      this.services.push(new SentryModeService(context));
    }

    if (getConfigValue(config, "starter")) {
      this.services.push(new StarterService(context));
    }

    if (
      getConfigValue(config, "homeLink") &&
      getConfigValue(config, "latitude") &&
      getConfigValue(config, "longitude")
    ) {
      this.services.push(new HomeLinkService(context));
    }
  }

  getServices() {
    return this.services.map((service) => service.service);
  }
}
