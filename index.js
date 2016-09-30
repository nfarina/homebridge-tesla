var teslams = require('teslams');
var util = require('util');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

function TeslaAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.vin = config["vin"];
  this.username = config["username"];
  this.password = config["password"];

  this.lockService = new Service.LockMechanism(this.name);

  this.lockService
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getLockState.bind(this));

  this.lockService
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getLockState.bind(this))
    .on('set', this.setLockState.bind(this));

  // teslams.get_vid({email:this.username,password:this.password}, function(vid) {
  //
  //   this.log('Got Tesla VID: ' + vid);
  //   this.vid = vid;
  //
  //   teslams.get_climate_state(vid, function(result) {
  //
  //     /* State is something like:
  //
  //      { inside_temp: null,
  //        outside_temp: null,
  //        driver_temp_setting: 22.6,
  //        passenger_temp_setting: 22.6,
  //        is_auto_conditioning_on: null,
  //        is_front_defroster_on: null,
  //        is_rear_defroster_on: false,
  //        fan_status: null,
  //        seat_heater_left: 0,
  //        seat_heater_right: 0,
  //        seat_heater_rear_left: 0,
  //        seat_heater_rear_right: 0,
  //        seat_heater_rear_center: 0,
  //        seat_heater_rear_right_back: 0,
  //        seat_heater_rear_left_back: 0,
  //        smart_preconditioning: false }
  //     */
  //
  //     this.log(util.inspect(result));
  //   }.bind(this));
  //
  // }.bind(this));

  this.setLockState(Characteristic.LockTargetState.SECURED, function() {});
}

// Get the ID of the vehicle in your account with the desired VIN.
TeslaAccessory.prototype.getID = function(callback) {

  teslams.all({email:this.username,password:this.password}, function(err, response, body) {

    /* Body is something like:
    {
      "response": [
        {
          "id": 9217217871923712,
          "vehicle_id": 726381761,
          "vin": "5JJYCB522AB296261",
          "display_name": "Tessie",
          "option_codes": "MDLX,RENA,...",
          "color": null,
          "tokens": [
            "8172638172361872",
            "9283329384729384"
          ],
          "state": "online",
          "id_s": "9217217871923712",
          "remote_start_enabled": true,
          "calendar_enabled": true,
          "notifications_enabled": true,
          "backseat_token": null,
          "backseat_token_updated_at": null
        }
      ],
      "count": 1
    }
    */
    if (err) {
      this.log("Error logging into Tesla: " + err);
      callback(err);
      return;
    }

    var vehicles = JSON.parse(body).response;

    for (var i=0; i<vehicles.length; i++) {
      var vehicle = vehicles[i];
      if (vehicle.vin == this.vin) {
        callback(null, vehicle.id_s);
        return;
      }
    }

    this.log("No vehicles were found matching the VIN '"+this.vin+"' entered in your config.json. Available vehicles:");
    for (var i=0; i<vehicles.length; i++) {
      var vehicle = vehicles[i];
      this.log("VIN: " + vehicle.vin + " Name: " + vehicle.display_name);
    }
    callback(new Error("Vehicle with VIN " + this.vin + " not found."));

  }.bind(this));
}

//
// Door locking/unlocking
//

TeslaAccessory.prototype.getLockState = function(callback) {
  this.log("Getting current state...");

  teslams.get_vid({email:this.username,password:this.password}, function(vid) {

    this.log('Got Tesla VID: ' + vid);
    this.vid = vid;

    teslams.get_vehicle_state(vid, function(state) {

      /* State is something like:

      { api_version: 3,
        autopark_state: 'unavailable',
        autopark_state_v2: 'ready',
        autopark_style: 'dead_man',
        calendar_supported: true,
        car_type: 'x',
        car_version: '2.36.31',
        center_display_state: 0,
        dark_rims: false,
        df: 0,
        dr: 0,
        exterior_color: 'Pearl',
        ft: 0,
        has_spoiler: true,
        homelink_nearby: false,
        last_autopark_error: 'no_error',
        locked: true,
        notifications_supported: true,
        odometer: 6152.574762,
        parsed_calendar_supported: true,
        perf_config: 'P1',
        pf: 0,
        pr: 0,
        rear_seat_heaters: 3,
        remote_start: false,
        remote_start_supported: true,
        rhd: false,
        roof_color: 'None',
        rt: 0,
        seat_type: 0,
        spoiler_type: 'Passive',
        sun_roof_installed: 0,
        sun_roof_percent_open: null,
        sun_roof_state: 'unknown',
        third_row_seats: 'FuturisFoldFlat',
        valet_mode: false,
        vehicle_name: 'Best Car Ever',
        wheel_type: 'AeroTurbine20' }
      */

      callback(null, state.locked);

    }.bind(this));

  }.bind(this));
}

TeslaAccessory.prototype.setLockState = function(state, callback) {

  var locked = (state == Characteristic.LockTargetState.SECURED);

  this.getID(function(err, id) {

    if (err) {
      callback(err);
      return;
    }

    this.log("Setting car to locked = " + locked);

    teslams.door_lock({id: id, lock: locked}, function(response) {

      if (response.result == true) {
        this.log("Car is now locked = " + locked);

        // we succeeded, so update the "current" state as well
        var currentState = (state == Characteristic.LockTargetState.SECURED) ?
          Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

        // We need to update the current state "later" because Siri can't
        // handle receiving the change event inside the same "set target state"
        // response.
        setTimeout(function() {
          this.lockService
            .setCharacteristic(Characteristic.LockCurrentState, currentState);
        }.bind(this), 1);

        callback(null); // success
      }
      else {
        this.log("Error setting lock state: " + util.inspect(arguments));
        callback(err || new Error("Error setting lock state."));
      }

    }.bind(this));

  }.bind(this));
},

TeslaAccessory.prototype.getServices = function() {
  return [this.lockService];
}
