// @flow

require('@babel/polyfill');

import type { ClimateState, Vehicle, VehicleState } from './util/types';
import {wait} from './util/wait';
import api from './util/api';
import callbackify from './util/callbackify';

const util = require('util');

let Service, Characteristic;

export default function(homebridge: Object) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  // From config.
  log: Function;
  name: string;
  vin: string;
  username: string;
  password: string;

  // Runtime state.
  authToken: ?string;
  vehicleID: ?string;

  // Services exposed.
  lockService: Object;
  climateService: Object;

  constructor(log, config) {
    this.log = log;
    this.name = config["name"];
    this.vin = config["vin"];
    this.username = config["username"];
    this.password = config["password"];

    this.lockService = new Service.LockMechanism(this.name);

    this.lockService
      .getCharacteristic(Characteristic.LockCurrentState)
      .on('get', callbackify(this.getLockCurrentState));

    this.lockService
      .getCharacteristic(Characteristic.LockTargetState)
      .on('get', callbackify(this.getLockTargetState))
      .on('set', callbackify(this.setLockTargetState));

    this.climateService = new Service.Switch(this.name);

    this.climateService
      .getCharacteristic(Characteristic.On)
      .on('get', callbackify(this.getClimateOn))
      .on('set', callbackify(this.setClimateOn));
  }

  getServices() {
    return [this.lockService, this.climateService];
  }

  getLockCurrentState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api('vehicleState', options);

    return state.locked ?
      Characteristic.LockCurrentState.SECURED :
      Characteristic.LockCurrentState.UNSECURED;
  }

  getLockTargetState = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: VehicleState = await api('vehicleState', options);

    return state.locked ?
      Characteristic.LockTargetState.SECURED :
      Characteristic.LockTargetState.UNSECURED;
  }

  setLockTargetState = async (state) => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log('Set lock state to', state);

    if (state === Characteristic.LockTargetState.SECURED) {
      await api('doorLock', options);
    }
    else {
      await api('doorUnlock', options);
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    if (state == Characteristic.LockTargetState.SECURED) {
      this.lockService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.SECURED,
      );
    }
    else {
      this.lockService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
    }
  }

  getClimateOn = async () => {
    const options = await this.getOptions();

    // This will only succeed if the car is already online. We don't want to
    // wake it up just to see if climate is on because that could drain battery!
    const state: ClimateState = await api('climateState', options);

    const on = state.is_auto_conditioning_on;

    this.log('Climate on?', on);
    return on;
  }

  setClimateOn = async on => {
    const options = await this.getOptions();

    // Wake up, this is important!
    await this.wakeUp();

    this.log('Set climate to', on);

    if (on) {
      await api('climateStart', options);
    }
    else {
      await api('climateStop', options);
    }
  }

  getAuthToken = async (): Promise<string> => {
    const {username, password, authToken} = this;

    // Return cached value if we have one.
    if (authToken) return authToken;

    this.log('Logging into Tesla with username/password…');
    const result = await api('login', username, password);
    const token = result.authToken;

    // Save it in memory for future API calls.
    this.log('Got a login token.');
    this.authToken = token;
    return token;
  }

  getOptions = async (): Promise<{authToken: string, vehicleID: string}> => {

    // First login if we don't have a token.
    const authToken = await this.getAuthToken();

    // Grab the string ID of your vehicle.
    const {id_s: vehicleID} = await this.getVehicle();

    return {authToken, vehicleID};
  }

  getVehicle = async () => {
    const {vin} = this;

    // Only way to do this is to get ALL vehicles then filter out the one
    // we want.
    const authToken = await this.getAuthToken();
    const vehicles: Vehicle[] = await api('allVehicles', {authToken});

    // Now figure out which vehicle matches your VIN.
    // `vehicles` is something like:
    // [ { id_s: '18488650400306554', vin: '5YJ3E1EA8JF006024', state: 'asleep', ... }, ... ]
    const vehicle = vehicles.find(v => v.vin === vin);

    if (!vehicle) {
      this.log('No vehicles were found matching the VIN ${vin} entered in your config.json. Available vehicles:');
      for (const vehicle of vehicles) {
        this.log('${vehicle.vin} [${vehicle.display_name}]');
      }

      throw new Error(`Couldn't find vehicle with VIN ${vin}.`);
    }

    this.log(`Using vehicle "${vehicle.display_name}" with state "${vehicle.state}"`);

    return vehicle;
  }

  wakeUp = async () => {
    const options = await this.getOptions();

    // Send the command.
    await api('wakeUp', options);

    // Wait up to 30 seconds for the car to wake up.
    const THIRTY_SECONDS = 30 * 1000;
    const start = Date.now();
    let waitTime = 1000;

    while ((Date.now() - start) < THIRTY_SECONDS) {

      // Poll Tesla for the latest on this vehicle.
      const {state} = await this.getVehicle();

      if (state === 'online') {
        // Success!
        return;
      }

      this.log('Waiting for vehicle to wake up…');
      await wait(waitTime);

      // Use exponential backoff with a max wait of 5 seconds.
      waitTime = Math.min(waitTime * 2, 5000);
    }

    throw new Error('Vehicle did not wake up within 30 seconds.');
  }
}
