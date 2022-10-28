import { Logging } from "homebridge";
import { lock } from "./mutex";
import { getAccessToken } from "./token";
import { TeslaPluginConfig, Vehicle } from "./types";
import { wait } from "./wait";

const tesla = require("teslajs");

export class TeslaApi {
  private log: Logging;
  private config: TeslaPluginConfig;

  // Runtime state.
  private authToken: string | undefined;
  private authTokenExpires: number | undefined;
  private authTokenError: Error | undefined;

  constructor(log: Logging, config: TeslaPluginConfig) {
    this.log = log;
    this.config = config;
  }

  getOptions = async (): Promise<TeslaJSOptions> => {
    // Use a mutex to prevent multiple logins happening in parallel.
    const unlock = await lock("getOptions", 20000);

    try {
      // First login if we don't have a token.
      const authToken = await this.getAuthToken();

      // Grab the string ID of your vehicle and the current state.
      const { id_s: vehicleID, state } = await this.getVehicle();

      return { authToken, vehicleID, isAsleep: state === "asleep" };
    } finally {
      unlock();
    }
  };

  getAuthToken = async (): Promise<string> => {
    // Use a mutex to prevent multiple logins happening in parallel.
    const unlock = await lock("getAuthToken", 20000);

    try {
      const { config, authToken, authTokenExpires, authTokenError } = this;
      const { refreshToken } = config;

      if (authTokenError) {
        throw new Error("Authentication has previously failed; not retrying.");
      }

      // Return cached value if we have one, and if it hasn't expired.
      if (authToken && authTokenExpires && Date.now() < authTokenExpires) {
        return authToken;
      }

      this.log("Exchanging refresh token for an access token…");
      const response = await getAccessToken(refreshToken);

      // Save it in memory for future API calls.
      this.log("Got an access token.");
      this.authToken = response.access_token;
      this.authTokenExpires = response.expires_in * 1000 + Date.now() - 10000; // 10 second slop
      return response.access_token;
    } catch (error: any) {
      this.authTokenError = error;
      throw error;
    } finally {
      unlock();
    }
  };

  getVehicle = async () => {
    const { vin } = this.config;

    // Only way to do this is to get ALL vehicles then filter out the one
    // we want.
    const authToken = await this.getAuthToken();
    const vehicles: Vehicle[] = await api("vehicles", { authToken });

    // Now figure out which vehicle matches your VIN.
    // `vehicles` is something like:
    // [ { id_s: '18488650400306554', vin: '5YJ3E1EA8JF006024', state: 'asleep', ... }, ... ]
    const vehicle = vehicles.find((v) => v.vin === vin);

    if (!vehicle) {
      this.log(
        "No vehicles were found matching the VIN ${vin} entered in your config.json. Available vehicles:",
      );
      for (const vehicle of vehicles) {
        this.log(`${vehicle.vin} [${vehicle.display_name}]`);
      }

      throw new Error(`Couldn't find vehicle with VIN ${vin}.`);
    }

    // this.log(
    //   `Using vehicle "${vehicle.display_name}" with state "${vehicle.state}"`,
    // );

    return vehicle;
  };

  wakeUp = async (options: TeslaJSOptions) => {
    // Is the car awake already?
    if (!options.isAsleep) {
      this.log("Vehicle is awake.");
      return;
    }

    this.log("Sending wakeup command…");

    // Send the command.
    await api("wakeUp", options);

    // Wait up to 30 seconds for the car to wake up.
    const start = Date.now();
    let waitTime = 1000;
    const waitMinutes = this.config.waitMinutes || 1;

    while (Date.now() - start < waitMinutes * 60 * 1000) {
      // Poll Tesla for the latest on this vehicle.
      const { state } = await this.getVehicle();

      if (state === "online") {
        // Success!
        this.log("Vehicle is now awake.");
        return;
      }

      this.log("Waiting for vehicle to wake up...");
      await wait(waitTime);

      // Use exponential backoff with a max wait of 5 seconds.
      waitTime = Math.min(waitTime * 2, 5000);
    }

    throw new Error(`Vehicle did not wake up within ${waitMinutes} minutes.`);
  };

  allIgnored: string[] = [];
  logAllIgnoredTimeoutId: NodeJS.Timeout | undefined;

  logIgnored = (ignored: string) => {
    this.allIgnored.push(ignored);
    if (this.logAllIgnoredTimeoutId) {
      clearTimeout(this.logAllIgnoredTimeoutId);
    }
    this.logAllIgnoredTimeoutId = setTimeout(() => {
      this.log(
        `Vehicle was asleep; ignored ${this.allIgnored.length} requests for current state`,
      );
      this.allIgnored = [];
    }, 2500);
  };
}

interface TeslaJSOptions {
  authToken: string;
  vehicleID: string;
  isAsleep: boolean;
}

//tesla.setLogLevel(tesla.API_LOG_ALL);

// Wrapper for TeslaJS functions that don't throw Error objects!
export default async function api(name: string, ...args: any[]): Promise<any> {
  try {
    return await tesla[name + "Async"](...args);
  } catch (errorOrString) {
    let error;

    if (typeof errorOrString === "string") {
      error = new Error(errorOrString);
    } else {
      error = errorOrString;
    }

    if (error.message === "Error response: 408") {
      console.log("Tesla timed out communicating with the vehicle.");
    } else {
      console.log("TeslaJS error:", errorOrString);
    }

    throw error;
  }
}
