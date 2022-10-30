import { schema } from "../../config.schema.json";

// Maps the type definition of config.schema.json to an actual TypeScript type.
export type TeslaPluginConfig = {
  [key in keyof typeof schema.properties]: typeof schema.properties[key]["default"];
};

export function getConfigValue<T extends keyof TeslaPluginConfig>(
  config: TeslaPluginConfig,
  key: T,
): TeslaPluginConfig[T] {
  return config[key] ?? schema.properties[key].default;
}

//
// Manually-inferred types for objects returned by Tesla's API
//

export interface Vehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  color: any;
  tokens: string[];
  state: "online" | "asleep";
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token: any;
  backseat_token_updated_at: any;
}

const ExampleVehicleResponse = {
  id: 18428374682376423,
  vehicle_id: 237642873,
  vin: "5YJ3E1EB2382738",
  display_name: "My Model 3",
  option_codes:
    "AD15,MDL3,PBSB,RENA,BT37,ID3W,RF3G,S3PB,DRLH,DV2W,W39B,APF0,COUS,BC3B,CH07,PC30,FC3P,FG31,GLFR,HL31,HM31,IL31,LTPB,MR31,FM3B,RS3H,SA3P,STCP,SC04,SU3C,T3CA,TW00,TM00,UT3P,WR00,AU3P,APH3,AF00,ZCST,MI00,CDM0",
  color: null,
  tokens: ["0324924232f57412", "38f9a2823c3ce123"],
  state: "online",
  in_service: false,
  id_s: "18428374682376423",
  calendar_enabled: true,
  api_version: 4,
  backseat_token: null,
  backseat_token_updated_at: null,
};

export interface VehicleState {
  api_version: number;
  autopark_state_v3: "standby" | string;
  autopark_style: "dead_man" | string;
  calendar_supported: boolean;
  car_version: string;
  center_display_state: number;
  df: number;
  dr: number;
  ft: number;
  homelink_nearby: boolean;
  is_user_present: boolean;
  last_autopark_error: "no_error";
  locked: boolean;
  media_state: { remote_control_enabled: boolean };
  notifications_supported: boolean;
  odometer: number;
  parsed_calendar_supported: boolean;
  pf: number;
  pr: number;
  remote_start: boolean;
  remote_start_supported: boolean;
  rt: number;
  sentry_mode: boolean;
  software_update: {
    expected_duration_sec: number;
    status: string;
  };
  speed_limit_mode: {
    active: boolean;
    current_limit_mph: number;
    max_limit_mph: number;
    min_limit_mph: number;
    pin_code_set: boolean;
  };
  sun_roof_percent_open: null;
  sun_roof_state: "unknown" | string;
  timestamp: number;
  valet_mode: boolean;
  valet_pin_needed: boolean;
  vehicle_name: "My Model 3";
}

const ExampleVehicleStateResponse = {
  api_version: 4,
  autopark_state_v3: "standby",
  autopark_style: "dead_man",
  calendar_supported: true,
  car_version: "2018.42.3 eb373a0",
  center_display_state: 4,
  df: 0,
  dr: 0,
  ft: 0,
  homelink_nearby: false,
  is_user_present: true,
  last_autopark_error: "no_error",
  locked: true,
  media_state: { remote_control_enabled: true },
  notifications_supported: true,
  odometer: 3666.991197,
  parsed_calendar_supported: true,
  pf: 0,
  pr: 0,
  remote_start: false,
  remote_start_supported: true,
  rt: 0,
  software_update: { expected_duration_sec: 2700, status: "" },
  speed_limit_mode: {
    active: false,
    current_limit_mph: 85,
    max_limit_mph: 90,
    min_limit_mph: 50,
    pin_code_set: false,
  },
  sun_roof_percent_open: null,
  sun_roof_state: "unknown",
  timestamp: 1542322919181,
  valet_mode: false,
  valet_pin_needed: true,
  vehicle_name: "My Model 3",
};

export interface ClimateState {
  battery_heater: boolean;
  battery_heater_no_power: any;
  defrost_mode: number;
  driver_temp_setting: number;
  fan_status: number;
  inside_temp: number;
  is_auto_conditioning_on: boolean;
  is_climate_on: boolean;
  is_front_defroster_on: boolean;
  is_preconditioning: boolean;
  is_rear_defroster_on: boolean;
  left_temp_direction: number;
  max_avail_temp: number;
  min_avail_temp: number;
  outside_temp: number;
  passenger_temp_setting: number;
  right_temp_direction: number;
  seat_heater_left: boolean;
  seat_heater_rear_center: boolean;
  seat_heater_rear_left: boolean;
  seat_heater_rear_left_back: number;
  seat_heater_rear_right: boolean;
  seat_heater_rear_right_back: number;
  seat_heater_right: boolean;
  side_mirror_heaters: boolean;
  smart_preconditioning: boolean;
  steering_wheel_heater: boolean;
  timestamp: number;
  wiper_blade_heater: boolean;
}

const ExampleClimateStateResponse: ClimateState = {
  battery_heater: false,
  battery_heater_no_power: null,
  defrost_mode: 0,
  driver_temp_setting: 22.2,
  fan_status: 0,
  inside_temp: 12.9,
  is_auto_conditioning_on: false,
  is_climate_on: false,
  is_front_defroster_on: false,
  is_preconditioning: false,
  is_rear_defroster_on: false,
  left_temp_direction: 867,
  max_avail_temp: 28,
  min_avail_temp: 15,
  outside_temp: 11,
  passenger_temp_setting: 22.2,
  right_temp_direction: 867,
  seat_heater_left: false,
  seat_heater_rear_center: false,
  seat_heater_rear_left: false,
  seat_heater_rear_left_back: 0,
  seat_heater_rear_right: false,
  seat_heater_rear_right_back: 0,
  seat_heater_right: false,
  side_mirror_heaters: false,
  smart_preconditioning: false,
  steering_wheel_heater: false,
  timestamp: 1542321649472,
  wiper_blade_heater: false,
};

// Based on the response for a Model X.
export interface VehicleData {
  id: number; // 9207250895329201,
  user_id: number; // 132001,
  vehicle_id: number; // 1327286312,
  vin: string; // "5YJXCAE12DA106127",
  display_name: string; // "Tessie",
  option_codes: string; // "MDLX,RENA,AD15,AF02,AH00,AU01,BC0B,BP00,BS00,BTX4,CC02,CDM0,CH00,PPSW,COUS,CW02,DA02,DRLH,DSH7,DV4W,FG02,FR02,GLFR,HP00,IDHM,IX01,LP01,LT3T,ME02,MI00,MX01,PA00,PF00,PI01,PK00,PS00,QLET,RFPX,S06T,SC01,SP00,SR04,ST02,SU01,TIC4,TM00,TP03,TR01,TRA1,TW01,UM01,USST,UTAW,WT20,X001,X003,X007,X011,X013,X021,X025,X026,X028,X031,X037,X040,X042,YFFC";
  color: any; // null,
  tokens: string[]; // ["18c2ee47ec24a", "76b815913b8a9"],
  state: "online" | "asleep"; // "online",
  in_service: boolean; // false,
  id_s: string; // "9207250895329201",
  calendar_enabled: boolean; // true,
  api_version: number; // 6,
  backseat_token: any; // null,
  backseat_token_updated_at: any; // null,
  drive_state: {
    gps_as_of: number; // 1549474998,
    heading: number; // 268,
    latitude: number; // 45.52221,
    longitude: number; // -122.111134,
    native_latitude: number; // 45.52221,
    native_location_supported: number; // 1,
    native_longitude: number; // -122.111134,
    native_type: string; // "wgs",
    power: number; // 0,
    shift_state: any; // null,
    speed: any; // null,
    timestamp: number; // 1549475000581,
  };
  charge_state: {
    battery_heater_on: boolean; // false,
    battery_level: number; // 80,
    battery_range: number; // 198.7,
    charge_current_request: number; // 48,
    charge_current_request_max: number; // 48,
    charge_enable_request: boolean; // false,
    charge_energy_added: number; // 25.03,
    charge_limit_soc: number; // 90,
    charge_limit_soc_max: number; // 100,
    charge_limit_soc_min: number; // 50,
    charge_limit_soc_std: number; // 90,
    charge_miles_added_ideal: number; // 99,
    charge_miles_added_rated: number; // 77,
    charge_port_cold_weather_mode: any; // null,
    charge_port_door_open: boolean; // false,
    charge_port_latch: string; // "Engaged",
    charge_rate: number; // 0,
    charge_to_max_range: boolean; // false,
    charger_actual_current: number; // 0,
    charger_phases: any; // null,
    charger_pilot_current: number; // 48,
    charger_power: number; // 0,
    charger_voltage: number; // 0,
    charging_state: "Disconnected" | "Stopped" | "Charging";
    conn_charge_cable: string; // "<invalid>",
    est_battery_range: number; // 136.03,
    fast_charger_brand: number; // "<invalid>",
    fast_charger_present: boolean; // false,
    fast_charger_type: number; // "<invalid>",
    ideal_battery_range: number; // 254.46,
    managed_charging_active: boolean; // false,
    managed_charging_start_time: any; // null,
    managed_charging_user_canceled: boolean; // false,
    max_range_charge_counter: number; // 0,
    not_enough_power_to_heat: boolean; // false,
    scheduled_charging_pending: boolean; // false,
    scheduled_charging_start_time: any; // null,
    time_to_full_charge: number; // 0,
    timestamp: number; // 1549475000584,
    trip_charging: boolean; // false,
    usable_battery_level: number; // 79,
    user_charge_enable_request: any; // null,
  };
  gui_settings: {
    gui_24_hour_time: boolean; // false,
    gui_charge_rate_units: string; // "mi/hr",
    gui_distance_units: string; // "mi/hr",
    gui_range_display: string; // "Rated",
    gui_temperature_units: string; // "F",
    timestamp: number; // 1549475000582,
  };
  vehicle_config: {
    can_accept_navigation_requests: boolean; // true,
    can_actuate_trunks: boolean; // true,
    car_special_type: string; // "base",
    car_type: string; // "modelx",
    charge_port_type: string; // "US",
    eu_vehicle: boolean; // false,
    exterior_color: string; // "Pearl",
    has_air_suspension: boolean; // true,
    has_ludicrous_mode: boolean; // false,
    motorized_charge_port: boolean; // true,
    perf_config: string; // "P1",
    plg: boolean; // true,
    rear_seat_heaters: number; // 3,
    rear_seat_type: number; // 3,
    rhd: boolean; // false,
    roof_color: string; // "None",
    seat_type: number; // 0,
    spoiler_type: any; // "Passive",
    sun_roof_installed: number; // 0,
    third_row_seats: string; // "FuturisFoldFlat",
    timestamp: number; // 1549475000601,
    trim_badging: string; // "90d",
    wheel_type: string; // "AeroTurbine20",
  };
  climate_state: {
    battery_heater: boolean; // false,
    battery_heater_no_power: boolean; // false,
    driver_temp_setting: number; // 21.7,
    fan_status: number; // 0,
    inside_temp: number; // 10.2,
    is_auto_conditioning_on: boolean; // false,
    is_climate_on: boolean; // false,
    is_front_defroster_on: boolean; // false,
    is_preconditioning: boolean; // false,
    is_rear_defroster_on: boolean; // false,
    left_temp_direction: number; // 536,
    max_avail_temp: number; // 28,
    min_avail_temp: number; // 15,
    outside_temp: number; // -2.5,
    passenger_temp_setting: number; // 21.7,
    remote_heater_control_enabled: boolean; // false,
    right_temp_direction: number; // 536,
    seat_heater_left: number; // 0,
    seat_heater_rear_left: number; // 0,
    seat_heater_rear_right: number; // 0,
    seat_heater_right: number; // 0,
    seat_heater_third_row_left: number; // 0,
    seat_heater_third_row_right: number; // 0,
    side_mirror_heaters: boolean; // false,
    smart_preconditioning: boolean; // false,
    steering_wheel_heater: boolean; // false,
    timestamp: number; // 1549475000606,
    wiper_blade_heater: boolean; // false,
  };
  vehicle_state: {
    api_version: number; // 6,
    autopark_state_v2: string; // "ready",
    autopark_style: string; // "dead_man",
    calendar_supported: boolean; // true,
    car_version: string; // "2018.50.6 4ec03ed",
    center_display_state: number; // 0,
    df: number; // 0,
    dr: number; // 0,
    ft: number; // 0,
    homelink_nearby: boolean; // false,
    is_user_present: boolean; // false,
    last_autopark_error: string; // "no_error",
    locked: boolean; // true,
    media_state: {
      remote_control_enabled: boolean; // true
    };
    notifications_supported: boolean; // true,
    odometer: number; // 35622.523196,
    parsed_calendar_supported: boolean; // true,
    pf: number; // 0,
    pr: number; // 0,
    remote_start: boolean; // false,
    remote_start_supported: boolean; // true,
    rt: number; // 0,
    software_update: {
      expected_duration_sec: number; // 2700,
      status: string; // ""
    };
    speed_limit_mode: {
      active: boolean; // false,
      current_limit_mph: number; // 85,
      max_limit_mph: number; // 90,
      min_limit_mph: number; // 50,
      pin_code_set: boolean; // false,
    };
    sun_roof_percent_open: any; // null,
    sun_roof_state: string; // "unknown",
    timestamp: number; // 1549475000612,
    valet_mode: boolean; // false,
    vehicle_name: string; // "Tessie",
    sentry_mode: boolean; // false,
  };
}

// Example response for a Model 3.
const ExampleVehicleDataResponse = {
  id: 18488650400251,
  user_id: 137712,
  vehicle_id: 911140036,
  vin: "5YJ3E1EB2382738",
  display_name: "Nicki",
  option_codes:
    "AD15,MDL3,PBSB,RENA,BT37,ID3W,RF3G,S3PB,DRLH,DV2W,W39B,APF0,COUS,BC3B,CH07,PC30,FC3P,FG31,GLFR,HL31,HM31,IL31,LTPB,MR31,FM3B,RS3H,SA3P,STCP,SC04,SU3C,T3CA,TW00,TM00,UT3P,WR00,AU3P,APH3,AF00,ZCST,MI00,CDM0",
  color: null,
  tokens: ["41899f9c41629", "229a1f92b32b9"],
  state: "online",
  in_service: false,
  id_s: "18488650400251",
  calendar_enabled: true,
  api_version: 6,
  backseat_token: null,
  backseat_token_updated_at: null,
  charge_state: {
    battery_heater_on: false,
    battery_level: 82,
    battery_range: 247.18,
    charge_current_request: 48,
    charge_current_request_max: 48,
    charge_enable_request: false,
    charge_energy_added: 27.2,
    charge_limit_soc: 90,
    charge_limit_soc_max: 100,
    charge_limit_soc_min: 50,
    charge_limit_soc_std: 90,
    charge_miles_added_ideal: 116,
    charge_miles_added_rated: 116,
    charge_port_cold_weather_mode: true,
    charge_port_door_open: false,
    charge_port_latch: "Disengaged",
    charge_rate: 0,
    charge_to_max_range: false,
    charger_actual_current: 0,
    charger_phases: null,
    charger_pilot_current: 48,
    charger_power: 0,
    charger_voltage: 1,
    charging_state: "Disconnected",
    conn_charge_cable: "<invalid>",
    est_battery_range: 135.65,
    fast_charger_brand: "<invalid>",
    fast_charger_present: false,
    fast_charger_type: "<invalid>",
    ideal_battery_range: 247.18,
    managed_charging_active: false,
    managed_charging_start_time: null,
    managed_charging_user_canceled: false,
    max_range_charge_counter: 0,
    not_enough_power_to_heat: null,
    scheduled_charging_pending: false,
    scheduled_charging_start_time: null,
    time_to_full_charge: 0,
    timestamp: 1549478247980,
    trip_charging: false,
    usable_battery_level: 80,
    user_charge_enable_request: null,
  },
  vehicle_config: {
    can_accept_navigation_requests: true,
    can_actuate_trunks: true,
    car_special_type: "base",
    car_type: "model3",
    charge_port_type: "US",
    eu_vehicle: false,
    exterior_color: "MidnightSilver",
    has_air_suspension: false,
    has_ludicrous_mode: false,
    motorized_charge_port: true,
    perf_config: "Base",
    plg: null,
    rear_seat_heaters: 1,
    rear_seat_type: null,
    rhd: false,
    roof_color: "Glass",
    seat_type: null,
    spoiler_type: "None",
    sun_roof_installed: null,
    third_row_seats: "<invalid>",
    timestamp: 1549478247979,
    trim_badging: "74",
    wheel_type: "Stiletto19",
  },
  drive_state: {
    gps_as_of: 1549478247,
    heading: 360,
    latitude: 45.122047,
    longitude: -122.122234,
    native_latitude: 45.122047,
    native_location_supported: 1,
    native_longitude: -122.122234,
    native_type: "wgs",
    power: 0,
    shift_state: null,
    speed: null,
    timestamp: 1549478247979,
  },
  gui_settings: {
    gui_24_hour_time: false,
    gui_charge_rate_units: "mi/hr",
    gui_distance_units: "mi/hr",
    gui_range_display: "Rated",
    gui_temperature_units: "F",
    timestamp: 1549478247993,
  },
  vehicle_state: {
    api_version: 6,
    autopark_state_v3: "ready",
    autopark_style: "dead_man",
    calendar_supported: true,
    car_version: "2018.50.6 4ec03ed",
    center_display_state: 0,
    df: 0,
    dr: 0,
    ft: 0,
    homelink_nearby: false,
    is_user_present: false,
    last_autopark_error: "no_error",
    locked: true,
    media_state: { remote_control_enabled: true },
    notifications_supported: true,
    odometer: 4537.618649,
    parsed_calendar_supported: true,
    pf: 0,
    pr: 0,
    remote_start: false,
    remote_start_supported: true,
    rt: 0,
    software_update: { expected_duration_sec: 2700, status: "" },
    speed_limit_mode: {
      active: false,
      current_limit_mph: 85,
      max_limit_mph: 90,
      min_limit_mph: 50,
      pin_code_set: false,
    },
    sun_roof_percent_open: null,
    sun_roof_state: "unknown",
    timestamp: 1549478247975,
    valet_mode: false,
    valet_pin_needed: true,
    vehicle_name: "Nicki",
  },
  climate_state: {
    battery_heater: false,
    battery_heater_no_power: null,
    driver_temp_setting: 22.2,
    fan_status: 0,
    inside_temp: -1.9,
    is_auto_conditioning_on: false,
    is_climate_on: false,
    is_front_defroster_on: false,
    is_preconditioning: false,
    is_rear_defroster_on: false,
    left_temp_direction: 969,
    max_avail_temp: 28,
    min_avail_temp: 15,
    outside_temp: -2,
    passenger_temp_setting: 22.2,
    remote_heater_control_enabled: false,
    right_temp_direction: 969,
    seat_heater_left: 0,
    seat_heater_rear_center: 0,
    seat_heater_rear_left: 0,
    seat_heater_rear_right: 0,
    seat_heater_right: 0,
    side_mirror_heaters: false,
    smart_preconditioning: false,
    timestamp: 1549478247978,
    wiper_blade_heater: false,
  },
};
