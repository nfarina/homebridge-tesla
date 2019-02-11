# Tesla Accessory

Example config.json:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "trunk": "Trunk",
          "frunk": "Front Trunk",
          "chargePort": "Charge Port",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran",
          "waitMinutes": 1
        }
      ]
    }

Exposes a Door Lock service and Climate Control on/off switch.

_If_ you define a value for `trunk` (as in the above example),
it will expose a separate Lock service for the rear trunk. You should pick
a unique name for this lock, like "Trunk" in the example above.

_If_ you define a value for `frunk` (as in the above example),
it will expose a separate Lock service for the front trunk. You should pick
a unique name for this lock, like "Front Trunk" in the example above.

_If_ you define a value for `chargePort`,
it will expose a separate Lock service for the charge port. You should pick
a unique name for this lock, like "Charge Port" in the example above.

_If_ you define a value for `waitMinutes`, you can control the amount of
time the plugin will wait for the car to wake up. The default is one minute.

If you use the example above, you would gain Siri commands like:

- _"Open the Model 3"_ (unlock the vehicle)
- _"Open the Front Trunk"_ (pop the frunk)
- _"Open the Charge Port"_ (charge port opens)
- _"Turn on the Model 3"_ (turn on climate control)

## Multiple Vehicles

Have a garage full of Teslas? Well you're in luck Mr. Musk, becuase you can
easily add all of them to HomeKit by creating a separate accessory for each one
distinguished by their unique VIN numbers:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "trunk": "Trunk",
          "frunk": "Front Trunk",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        },
        {
          "accessory": "Tesla",
          "name": "Model X",
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
- _"Turn on the Model X"_ (turn on climate control **on the Model X**)

**Important Note**: The names you choose for the various locks are essentially
_global_. That means if you want to open the front trunks of both your Model 3
and Model X, you'll want to give them unique names like "Model X Front Trunk"
above.

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
