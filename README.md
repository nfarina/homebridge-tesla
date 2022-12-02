# Tesla Accessory

<p align="center"><img src="https://user-images.githubusercontent.com/117280/199400037-f17f6e02-5865-433c-80b2-6b09d70018a1.PNG" width="200px"/></p>

Got a Tesla? Want to let Siri boss it around? Look no further.

# Services

After [installation](#installation) below, you'll get the default services enabled:

- _"Unlock the car doors"_ (unlock the vehicle)
- _"Open the trunk"_
- _"Open the front trunk"_
- _"Set the climate to 72 degrees"_ (turns on climate control if off)
- _"Turn on sentry mode"_

You can also configure the plugin to enable these additional services:

- _"Set the charge limit to 80%"_
- _"Turn on the steering wheel heater"_
- _"Turn on the defrost"_
- _"Open the charge port"_
- _"Turn on the charger"_ (begins charging even if outside schedule)
- _"Turn on the starter"_ (enables keyless driving)
- _"Open HomeLink"_ (opens your garage or other door via HomeLink in supported vehicles)

**NOTE:** The "charge limit" service is exposed as a "Lightbulb" in HomeKit. This is the only way to get something Siri can control as a percentage value.

# Installation

If you're running a Homebridge UI like [`homebridge-ui-config-x`](https://github.com/oznu/homebridge-config-ui-x) then you can use it to install `homebridge-tesla` and configure it there. All configuration options should be supported.

# Manual Installation

```sh
npm install --global homebridge-tesla
```

Example config.json:

```json
{
  "accessories": [
    {
      "accessory": "Tesla",
      "name": "Model 3",
      "vin": "5JJYCB522AB296261",
      "refreshToken": "eyJhbGciOiJSUzI1…"
    }
  ]
}
```

To enable and disable services, you'll need to add more options. For example, to disable the Sentry Mode switch:

```yaml
  …
  "refreshToken": "eyJhbGciOiJSUzI1…",
  # Add this:
  "sentryMode": false
}
```

You can find the full list of configuration settings in [`config.schema.json`](config.schema.json).

## Setting up the Home App

The plugin exposes a single HomeKit "Accessory" representing the car, which contains multiple services for all the different switches and locks. _This is the way._

Unfortunately, there is a very annoying [known bug](https://github.com/homebridge/homebridge/issues/3210) with iOS 16 where, when adding accessories with multiple services, the services are all given the same name as the main accessory.

This means that if your accessory (car) name is "Model Y", then (for instance) the trunk service will be renamed to "Model Y". And you'll say "open the trunk" and Siri will say "I don't know what you mean."

You'll need to manually tap into each service tile and change its name back to what you want.
**NOTE** Tapping "X" on the accessory name will display the true name.

Additionally, you'll find that when you tap into the car in the Home app to, say, open the trunk, you'll see a big scrolling page of switches and locks with _no labels_. This is just what the Home app does.

To improve this, you can create a new "Room" in HomeKit for each car. So you might have a "Model Y" room, and you can place your Model Y accessory inside there. Then you can configure it to "Show as separate tiles" and you get this lovely presentation of all your widgets in the "room" (pictured at top).

Here's a [video demonstrating the complete setup process as of iOS 16](https://youtu.be/sgDJmwwSOYA).

## Waking the Car Up

Tesla cars love to go to "sleep" to preserve battery life, meaning their connection to the Tesla servers is usually not active.

Telling Siri to do something to your car will wake it up first. So "open the car doors" does what you'd expect: wakes up the car if needed, then opens the doors.

**IMPORTANT NOTE:** The car can take a long time to wake up! Often long enough that it exceeds Siri's hardcoded 10-seconds-or-so timeout. Because of this, the plugin is designed to only keep Siri waiting for a maximum of five seconds. After that, it will return "OK" to Siri and so you will not be notified if the command subsequently fails.

I've found that commands almost always succeed. If they fail a lot for you, you might make sure your car's Wifi connection (if at home) is strong enough. The car is _really_ picky about this (ask me how I know).

## Reading State

Asking Siri about your car, like "What's the charge level?" or "Is the trunk open?" will _not_ wake up the car. This is because Siri asks a lot in the background and we don't want this to impact the car's battery life.

If you ask Siri if the trunk is open, and the car is awake already, the plugin will query the car and you'll get the right answer. If the car is asleep, the plugin will return the last-known value, which may be wrong.

If you require the correct answer, you'll need to wake the car up first. You can do this by turning on the special "Connection" switch. This switch is not subject to the default five-second timeout, so if Siri thinks the switch is on, it's on for real and you can read accurate data about the car.

## Generating a Refresh Token

Tesla API access requires a "refresh token" which is tricky to get. There are some apps available that can help with this, check out [this list](https://teslascope.com/help/generating-tokens). I have personally used the macOS app "Auth app for Tesla" (linked via that site) and it worked for me.

Once you get a refresh token using an app (it's very long), you can paste it into your plugin configuration above.

**NOTE** This plugin used to accept an `authToken` property which was intended to be an optional refresh token. If you have one already, you can just paste that token in the `refreshToken` property. The `authToken` property is no longer used, since the name `refreshToken` is more accurate and sets the token apart from OAuth "access tokens" which are only good for 8 hours.

## Multiple Vehicles

Have a garage full of Teslas? Well you're in luck Mr. Musk, because you can
easily add all of them to HomeKit by creating a separate accessory for each one
distinguished by their unique VIN numbers:

```json
{
  "accessories": [
    {
      "accessory": "Tesla",
      "name": "Model 3",
      "vin": "5JJYCB522AB296261",
      "refreshToken": "…"
    },
    {
      "accessory": "Tesla",
      "name": "Model X",
      "vin": "1XSYCA2224A216162",
      "refreshToken": "…can be the same…"
    }
  ]
}
```

Note that you'll need to come up with different names for all the exposed services. The Home app will not let you have two services named "Trunk".

Instead, you could have a "Model Y Trunk" and a "Model 3 Trunk" and you'd just need to remember to use the right prefix when talking to Siri. You will need to do all this renaming in the Home app as in the video above.

## HomeLink

For vehicles with HomeLink support, the plugin allows you to enable the feature to send a HomeLink signal from the car. This is disabled by default. You also must provide a latitude and longitude value for the HomeLink device.

Once that is done, you can issue commands like "Open the HomeLink". If you don't have any other garage doors in HomeKit, you may also be able to just say "Open the garage door" since it's exposed as a true garage door service.

```yaml
  …
  "refreshToken": "…",
  "enableHomeLink": true,
  "latitude": "37.492655",
  "longitude": "-121.944644"
}
```

## Charge Level

The car can supply the current charge level of the battery as a percentage. As with the other services, this will only update if the car is awake.

Note that asking Siri about the "battery level" or "charge level" of anything will usually result in Siri telling you the battery level of your phone. Instead, you can ask Siri "Is the Model 3 charging?" and the level should be returned in the reply.

## Development

You can run Rollup in watch mode to automatically transpile code as you write it:

```sh
  npm run dev
```
