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

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
