import { API, Logger, Service } from "homebridge";
import { TeslaApi } from "../util/api";
import { TeslaPluginConfig } from "../util/types";

export abstract class TeslaPluginService {
  protected log: Logger;
  protected api: API;
  protected config: TeslaPluginConfig;
  protected tesla: TeslaApi;
  public apiService: Service;

  constructor(
    log: Logger,
    config: TeslaPluginConfig,
    api: API,
    tesla: TeslaApi,
  ) {
    this.log = log;
    this.api = api;
    this.config = config;
    this.tesla = tesla;
    this.apiService = this.getService();
  }

  protected prefixName(name: string): string {
    // Optional prefix to prepend to all accessory names.
    const prefix = (this.config.prefix ?? "").trim();

    if (prefix.length > 0) {
      return `${prefix} ${name}`;
    } else {
      return name;
    }
  }

  protected abstract getService(): Service;
}
