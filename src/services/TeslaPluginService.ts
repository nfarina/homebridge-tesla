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
import { TeslaPluginConfig } from "../util/types";

export abstract class TeslaPluginService {
  protected log: Logging;
  protected hap: HAP;
  protected config: TeslaPluginConfig;
  protected tesla: TeslaApi;
  public service: Service;

  constructor(
    log: Logging,
    config: TeslaPluginConfig,
    hap: HAP,
    tesla: TeslaApi,
  ) {
    this.log = log;
    this.hap = hap;
    this.config = config;
    this.tesla = tesla;
    this.service = this.createService();
  }

  protected abstract createService(): Service;

  protected serviceName(name: string): string {
    // Optional prefix to prepend to all accessory names.
    const prefix = (this.config.prefix ?? "").trim();

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
      getter
        .call(this)
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

type Getter<T extends CharacteristicValue> = (this: any) => Promise<T>;

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
