import { Service } from "homebridge";
import { TeslaPluginService } from "./TeslaPluginService";

export class ConnectionService extends TeslaPluginService {
  getService(): Service {
    throw new Error("Method not implemented.");
  }
}
