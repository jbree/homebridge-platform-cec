'use strict';

const cec = require('cec-promise');
const autobind = require('auto-bind');

class Receiver {

  constructor () {
    autobind(this);

    this.minVolume = 0;
    this.maxVolume = 100;
    this.name = 'Receiver';
  }

  getOn(callback) {
    cec.request(0xf5, 'GIVE_DEVICE_POWER_STATUS', 'REPORT_POWER_STATUS')
    .then(function (res) {
      var on = (res.status === 0) ? 1 : 0;
      console.log(`${this.name} getOn: ${on}`);
      return callback(null, on);
    }.bind(this))
    .catch(function (err) {
      console.log(err);
      return callback(err);
    });
  }

  setOn(on, callback) {
    this.getOn(function (err, isOn) {
      if (err !== null) {
        console.log(err);
        callback(err);
      } else {
        if (on === isOn) {
          console.log(`${this.name} setOn: already ${on ? 'on' : 'off'}`);
        } else {
          let newMode = isOn ? 'standby' : 'on';
          console.log(`${this.name} setOn: ${on}`);
          cec.send(`${newMode} 5`);
        }
        callback(null);
      }
    }.bind(this));
  }

  getRawVolume(callback) {
    cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
    .then(function (res) {
      let rawVolume = 0x7f & res.status;
      console.log(`${this.name} getRawVolume: ${rawVolume}`);
      return callback(null, rawVolume);
    }.bind(this))
    .catch(function (err) {
      return callback(err);
    });
  }

  getVolume(callback) {
    this.getRawVolume(function (err, vol) {
      if (err !== null) {
        callback(err);
      } else {
        console.log(`${this.name} getVolume: ${mapReceiverToSwitch(vol)}`);
        callback(null, mapReceiverToSwitch(vol));
      }
    }.bind(this));
  }

  setVolume(volume, callback) {
    let targetVolume = mapSwitchToReceiver(volume);
    let increase = false;

    var volumeAdjustmentLoop = function(increase, target) {
      this.getRawVolume(function(err, rawVolume) {
        if (err !== null) {
          console.log(err);
          callback(err);
        } else {
          // adjust volume
          if (increase && rawVolume < target && rawVolume < this.maxVolume) {
            console.log(`${this.name} increase volume`);
            cec.send('volup');
            setTimeout(volumeAdjustmentLoop, 300, true, target);
          } else if (!increase && rawVolume > target && rawVolume > this.minVolume) {
            console.log(`${this.name} decrease volume`);
            cec.send('voldown');
            setTimeout(volumeAdjustmentLoop, 300, false, target);
          } else {
            callback(null);
          }
        }
      }.bind(this));
    }.bind(this);

    // get the raw volume. if it's under the target, we need to increase.
    // otherwise, we need to, uh, !increase.
    this.getRawVolume(function(err,vol) {
      if(err !== null) {
        callback(err);
      } else {
        if (vol < targetVolume) {
          increase = true;
        }
        console.log(`${this.name} setVolume ${vol} -> ${targetVolume}`);
        volumeAdjustmentLoop(increase, targetVolume);
      }
    }.bind(this));
  }

  getMute(callback) {
    cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
    .then(function (res) {
      var mute = (0x80 & res.status) === 0 ? 0 : 1;
      console.log(`${this.name} getMute: ${mute}`);
      return callback(null, mute);
    }.bind(this))
    .catch(function (err) {
      console.log(err);
      return callback(err);
    }.bind(this));
  }

  setMute(mute, callback) {
    cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
    .then(function (res) {
      var currentMute = (0x80 & res.status) === 0 ? 0 : 1;
      if (currentMute === mute) {
        console.log(`${this.name} setMute: already ${mute}`);
      } else {
        cec.send('mute');
        console.log(`${this.name} setMute: ${currentMute} -> ${mute}`);
      }
      return callback(null);
    }.bind(this))
    .catch(function (err) {
      return callback(err);
    });
  }

}

function mapSwitchToReceiver(x) {
  if (x <= 15) {
    return 3*x;
  } else {
    return (11/17)*x + 36;
  }
}

function mapReceiverToSwitch(y) {
  if (y <= 45) {
    return 0.333 * y;
  } else {
    return (17 * (y - 36)) / 11;
  }
}

module.exports = new Receiver();
