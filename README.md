# homebridge-platform-cec
A Homebridge Plugin to Control Devices over HDMI-CEC

## Deprecated

See [homebridge-cec-accessory](https://github.com/jbree/homebridge-cec-accessory) instead.
## About

homebridge-platform-cec was written with Raspberry Pi in mind. I wanted the
ability to control my receiver's mute and volume level. After getting the
proof-of-concept working, I thought I'd grow the scope a little bit to control
other devices, so I refactored the prototype to make it more extendable(extensible?).

Currently, the plugin adds a Power and a Volume accessory to homebridge, both in
the form of, "Light," accessories. The volume is controlled by adjusting the
brightness of the light. Mute is controlled by turning off the "Light."

Eventually, I'd like to have the platform auto-discover devices and available
services, and make them available dynamically based on whether or not the device
is powered on.

Bug reports, feature requests, and pull requests welcome.

## Installation

### On a Raspberry Pi

1. Follow [these instructions](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi)
to install and run homebridge on Raspberry Pi. Don't give up. Hang in there.

2. Install cec-utils using package manager:  
`apt-get install cec-utils`

3. Install homebridge-platform-cec:  
`npm install -g homebridge-platform-cec`

4. Open an issue if you run into problems.

## Configuration

Your `~/.homebridge/config.json` file must include homebridge-platform-cec
listed in the platforms section:

```
"platforms": [
  {
    "platform": "CecPlatform",
    "name": "CecPlatform"
  }
]
```
