# Tesla Accessory

Example config.json:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran",
          "authToken": "authToken",
          "waitMinutes": 1
        }
      ]
    }

Exposes lock services for doors, trunk, and front trunk. Also exposes an on/off switch for climate control, charge state, and keyless driving.

_If_ you define a value for `waitMinutes`, you can control the amount of
time the plugin will wait for the car to wake up. The default is one minute.

_If_ you define a value for `authToken`,
you do not need to provide your username or password credentials.
Generating a token can be done many ways.
[Tokens for Teslas](https://tokens-for-teslas.herokuapp.com) is one option.
`npm install -g generate-tesla-token` is another.

If you use the example above, you would gain Siri commands like:

- _"Unlock the Model 3 Doors"_ (unlock the vehicle)
- _"Open the Model 3 Trunk"_ (pop the trunk)
- _"Open the Model 3 Front Trunk"_ (pop the frunk)
- _"Turn on the Model 3 Climate"_ (turn on climate control)
- _"Turn on the Model 3 Charger"_ (begin charging even if outside your schedule)
- _"Turn on the Model 3 Starter"_ (enable keyless driving for 2 minutes - requires `password` in config, `authToken` is not sufficient)

**Important Note**: The Home app will allow you to customize the default names of these services. You may be tempted to, for instance, change your "Model 3 Front Trunk" service to just "Front Trunk" so you can say "Open the Front Trunk". Don't do this! The names of these services are essentially _global_ and live in a giant pool of names. Siri will get confused unless every service has an easily distinguished name.

## Multiple Vehicles

Have a garage full of Teslas? Well you're in luck Mr. Musk, becuase you can
easily add all of them to HomeKit by creating a separate accessory for each one
distinguished by their unique VIN numbers:

    {
      "accessories": [
        {
          "accessory": "Tesla",
          "name": "Model 3",
          "vin": "5JJYCB522AB296261",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        },
        {
          "accessory": "Tesla",
          "name": "Model X",
          "vin": "1XSYCA2224A216162",
          "username": "bobs@burgers.com",
          "password": "bobbobbaran"
        }
      ]
    }

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
