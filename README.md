
# Tesla Accessory

Example config.json:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "frunk": "Front Trunk",
          "chargePort": "Charge Port",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        }
      ]
    }

Exposes a Door Lock service and Climate Control on/off switch.

*If* you define a value for `frunk` (as in the above example),
it will expose a separate Lock service for the front trunk. You should pick
a unique name for this lock, like "Front Trunk" in the example above.

*If* you define a value for `chargePort` (as in the above example),
it will expose a separate Lock service for the charge port. You should pick
a unique name for this lock, like "Charge Port" in the example above.

If you use the example above, you would gain Siri commands like:

  - *"Open the Model 3"* (unlock the vehicle)
  - *"Open the Front Trunk"* (pop the frunk)
  - *"Open the Charge Port"* (charge port opens)
  - *"Turn on the Model 3"* (turn on climate control)

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
