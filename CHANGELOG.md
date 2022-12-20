## Version 4.1.0

- Add option to expose climate service as a simple switch instead of a thermostat.

## Version 4.0.2

- Add possible fix for refresh tokens for vehicles in China.

## Version 4.0.1

- Fix "invalid target temperature" warning on newer Homebridge versions by using 10 instead of 0 as the default target temp value when the real value is not known.

## Version 4.0.0

- Complete plugin rewrite
- Caches last-known state of the car and always returns an answer to Siri for queries. This means "No Response" status messages in Home app should no longer happen.
- Sending commands to the vehicle will operate "in the background" if they take longer than 5 seconds. This means Siri will say "OK, the car doors are unlocked" but maybe they're not quite yet!
- Added CHANGELOG (har)
