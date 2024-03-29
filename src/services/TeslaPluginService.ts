import {
  CharacteristicGetCallback,
  CharacteristicValue,
  HAP,
  HAPStatus,
  Logging,
  Nullable,
  Service,
} from "homebridge";
import { TeslaApi } from "../util/api";
import { TeslaPluginConfig, VehicleData } from "../util/types";

export type TeslaPluginServiceContext = {
  log: Logging;
  hap: HAP;
  config: TeslaPluginConfig;
  tesla: TeslaApi;
};

export abstract class TeslaPluginService {
  protected context: TeslaPluginServiceContext;
  public abstract service: Service;

  constructor(context: TeslaPluginServiceContext) {
    this.context = context;
  }

  protected serviceName(name: string): string {
    const { config } = this.context;

    // Optional prefix to prepend to all accessory names.
    const prefix = (config.prefix ?? "").trim();

    if (prefix.length > 0) {
      return `${prefix} ${name}`;
    } else {
      return name;
    }
  }

  //
  // Typesafe callbackify.
  //

  protected createGetter<T extends CharacteristicValue>(
    getter: Getter<T>,
  ): GetterCallback {
    return (callback) => {
      this.context.tesla
        .getVehicleData()
        .then((data) => getter.call(this, data))
        .then((value) => callback(null, value))
        .catch((error: Error) => callback(error));
    };
  }

  protected createSetter<T extends CharacteristicValue>(
    setter: Setter<T>,
  ): SetterCallback {
    return (value, callback) => {
      setter
        .call(this, value as T)
        .then((writeResponse) => callback(null, writeResponse ?? undefined))
        .catch((error: Error) => callback(error));
    };
  }
}

type Getter<T extends CharacteristicValue> = (
  this: any,
  data: VehicleData | null,
) => Promise<T> | T;

type GetterCallback = (callback: CharacteristicGetCallback) => void;

type Setter<T extends CharacteristicValue> = (
  this: any,
  value: T,
) => Promise<Nullable<T> | void>;

type SetterCallback = (
  value: CharacteristicValue,
  callback: (
    error?: HAPStatus | Error | null,
    writeResponse?: Nullable<CharacteristicValue>,
  ) => void,
) => void;
