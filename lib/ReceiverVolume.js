'use strict';

module.exports = {
  setHomebridge: setHomebridge,
  ReceiverVolume: ReceiverVolume
};

let Accessory;
let Service;
let Characteristic;

function setHomebridge(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
}

const cec = require('cec-promise');

function ReceiverVolume (platform, id) {
  this.minVolume = 0;
  this.maxVolume = 100;
  this.log = platform.log;
  this.platform = platform;
  this.name = id.name;
  this.manufacturer = id.manufacturer;

  this.log.info(`Creating ${id.manufacturer} ReceiverVolume named ${id.name}`);

  this.errorTimeout = 500;

  this.infoService = new Service.AccessoryInformation();
  this.infoService
    .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
    .setCharacteristic(Characteristic.Model, this.name)
    .setCharacteristic(Characteristic.SerialNumber, '1234');

  this.service = new Service.Lightbulb(this.name);
  //TODO
  // this.service.setCharacteristic(Characteristic.On, this.hk.on);
  this.service.getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));

  // if (this.state.volume !== undefined) {
    //TODO
  this.service.getCharacteristic(Characteristic.Brightness)
    .on('get', this.getVolume.bind(this))
    .on('set', this.setVolume.bind(this));
}

ReceiverVolume.prototype.getServices = function () {
  return [this.service, this.infoService];
};


// ===== Homekit Events ==================================================================

ReceiverVolume.prototype.identify = function (callback) {
  this.log.info(`${this.name}: identify`);
  //FIXME
  return callback();
};

ReceiverVolume.prototype.getOn = function (callback) {
  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    var on = (0x80 & res.status) === 0 ? 1 : 0;
    this.log.info(`${this.name} getOn: ${on}`);
    return callback(null, on);
  }.bind(this))
  .catch(function (err) {
    this.log.err(err);
    return callback(err);
  }.bind(this));
};

ReceiverVolume.prototype.setOn = function (on, callback) {
  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    var currentOn = (0x80 & res.status) === 0 ? 1 : 0;
    if (currentOn === on) {
      this.log.info(`${this.name} setOn: already ${on}`);
    } else {
      cec.send('mute');
      this.log.info(`${this.name} setOn: ${currentOn} -> ${on}`);
    }
    return callback(null);
  }.bind(this))
  .catch(function (err) {
    return callback(err);
  });
};

ReceiverVolume.prototype.getVolume = function (callback) {
  this.getRawVolume(function (err, vol) {
    if (err !== null) {
      callback(err);
    } else {
      this.log.info(`${this.name} getVolume: ${mapReceiverToSwitch(vol)}`);
      callback(null, mapReceiverToSwitch(vol));
    }
  }.bind(this));

};

ReceiverVolume.prototype.getRawVolume = function (callback) {
  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    let rawVolume = 0x7f & res.status;
    this.log.info(`${this.name} getRawVolume: ${rawVolume}`);
    return callback(null, rawVolume);
  }.bind(this))
  .catch(function (err) {
    return callback(err);
  });
};

ReceiverVolume.prototype.setVolume = function (volume, callback) {
  let targetVolume = mapSwitchToReceiver(volume);
  let increase = false;

  var volumeAdjustmentLoop = function(increase, target) {
    this.getRawVolume(function(err, rawVolume) {
      if (err !== null) {
        callback(err);
      } else {
        // adjust volume
        if (increase && rawVolume < target && rawVolume < this.maxVolume) {
          this.log.info(`${this.name} increase volume`);
          cec.send('volup');
          setTimeout(volumeAdjustmentLoop, 300, true, target);
        } else if (!increase && rawVolume > target && rawVolume > this.minVolume) {
          this.log.info(`${this.name} decrease volume`);
          cec.send('voldown');
          setTimeout(volumeAdjustmentLoop, 300, false, target);
        } else {
          this.log.info(``);
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
      this.log.info(`${this.name} setVolume ${vol} -> ${targetVolume}`);
      volumeAdjustmentLoop(increase, targetVolume);
    }
  }.bind(this));
};

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
