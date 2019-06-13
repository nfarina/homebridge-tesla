# Tesla Accessory

Example config.json with all options:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "connection": "Model 3 Connection",
          "climate": "Model 3 Climate",
          "trunk": "Trunk",
          "frunk": "Front Trunk",
          "charger": "Model 3 Charger",
          "chargePort": "Charge Port",
          "lowBatteryLevel": 20,
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran",
          "authToken": "some-really-long-random-string",
          "waitMinutes": 1
        }
      ]
    }

By default, it exposes a Door Lock and Battery service.

Siri commands (based on above example):

- _"Open the Model 3"_ (unlock the vehicle)
- _"What's the battery status of the Model 3?"_

If you define a value for `lowBatteryLevel` (as in the above example), you may customize the threshold at which HomeKit will display the car as being "Low Battery". The default threshold is <= 20%.

If you define a value for `waitMinutes` (as in the above example), you can control the amount of time the plugin will wait for the car to wake up. The default is one minute.

## Auth Token

    {
      "accessory": "Tesla",
      ...
      "authToken": "some-really-long-random-string",
    }

If you define a value for `authToken`, you do not need to provide your username or password credentials. Generating a token can be done many ways. [Tokens for Teslas](https://tokens-for-teslas.herokuapp.com) is one option. `npm install -g generate-tesla-token` is another.

## Connection

    {
      "accessory": "Tesla",
      ...
      "connection": "Model 3 Connection",
    }

If you define a value for `connection`, it will expose a switch that will wake up the car. This can be useful if you want to ask Siri about things that the car must be "awake" and connected to the internet to answer, which is pretty much everything!

For example, if you ask "Is the Model 3 unlocked?" Siri might say "I couldn't reach your device" if the car is sleeping to save power. With the connection switch, you can first say "Turn on the Model 3 Connection" and the car will wake up (this could take a few seconds). After that you can ask if it's unlocked, or if climate is on, etc.

Additional Siri commands (based on above example):

- _"Turn on the Model 3 Connection"_

## Climate

    {
      "accessory": "Tesla",
      ...
      "climate": "Model 3 Climate",
    }

If you define a value for `climate`, it will expose a separate switch that turns on/off the climate control on the car.

Additional Siri commands (based on above example):

- _"Turn on the Model 3 Climate"_
- _"Turn off the Model 3 Climate"_
- _"Is the Model 3 Climate on?"_

## Trunks

    {
      "accessory": "Tesla",
      ...
      "trunk": "Trunk",
      "frunk": "Front Trunk",
    }

If you define a value for `trunk`, it will expose a separate Lock service for the rear trunk. You should pick a unique name for this lock, like "Trunk" in the example above.

If you define a value for `frunk` (as in the above example), it will expose a separate Lock service for the front trunk. You should pick a unique name for this lock, like "Front Trunk" in the example above.

Additional Siri commands (based on above example):

- _"Open the Trunk"_ (open/pop the trunk)
- _"Open the Front Trunk"_ (pop the frunk)

## Charging/Port

    {
      "accessory": "Tesla",
      ...
      "charger": "Model 3 Charger",
      "chargePort": "Charge Port",
    }

If you define a value for `charger`, it will expose a separate Switch service that will tell the car to start or stop charging. This can be handy if you have scheduled charging setup for your home. For instance, you might want to charge up the car the morning before a trip.

If you define a value for `chargePort`, it will expose a separate Lock service for the charge port. You should pick a unique name for this lock, like "Charge Port" in the example above.

Additional Siri commands (based on above example):

- _"Turn on the Model 3 Charger"_ (begins charging)
- _"Turn off the Model 3 Charger"_ (stops charging)
- _"Open the Charge Port"_
- _"Close the Charge Port"_

## Multiple Vehicles

Have a garage full of Teslas? Well you're in luck Mr. Musk, becuase you can
easily add all of them to HomeKit by creating a separate accessory for each one
distinguished by their unique VIN numbers:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "climate": "Model 3 Climate",
          "trunk": "Trunk",
          "frunk": "Front Trunk",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        },
        {
          "accessory": "Tesla",
          "name": "Model X",
          "climate": "Model X Climate",
          "trunk": "Pod Bay Doors",
          "frunk": "Model X Front Trunk",
          "vin": "1XSYCA2224A216162",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        }
      ]
    }

If you use the example above, you would gain Siri commands like:

- _"Open the Model 3"_ (unlock the Model 3)
- _"Open the Trunk"_ (pop the trunk on the Model 3)
- _"Open the Pod Bay Doors"_ (pop the trunk **on the Model X**)
- _"Turn on the Model X Climate"_ (turn on climate control **on the Model X**)
- _"What's Model 3's battery?"_ (report battery percentage of the Model 3)
- _"What's the charging status of Model 3?"_ (report charging status of the Model 3)

**Important Note**: The names you choose for the various locks are essentially
_global_. That means if you want to open the front trunks of both your Model 3
and Model X, you'll want to give them unique names like "Model X Front Trunk"
above.

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
