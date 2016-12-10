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
  this.log.info('%s: identify', this.name);
  //FIXME
  return callback();
};

ReceiverVolume.prototype.getOn = function (callback) {
  this.log.info(`${this.name} getOn`);

  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    var on = (0x80 & res.status) === 0;
    console.log(`getOn cb: ${on}`);
    return callback(null, on);
  })
  .catch(function (err) {
    console.log(err);
    return callback(err);
  });
};

ReceiverVolume.prototype.setOn = function (on, callback) {
  this.log.info(`${this.name} setOn`);

  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    var currentOn = (0x80 & res.status) === 0 ? 1 : 0;
    if (currentOn === on) {
      this.log.info(`${this.name} is already set to ${on}`);
    } else {
      cec.send('mute');
      this.log.info(`${this.name} changed from ${currentOn} to ${on}`);
    }
    return callback(null);
  }.bind(this))
  .catch(function (err) {
    return callback(err);
  });
};

ReceiverVolume.prototype.getVolume = function (callback) {
  this.log.info(`${this.name} getVolume`);

  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {

    var currentVolume = 0x7f & res.status;
    console.log(`getVol cb: ${ currentVolume} -> ${volumeMap(currentVolume)}`);
    return callback(null, volumeMap(currentVolume));
  })
  .catch(function (err) {
    console.log(`getVol err: ${err}`);
    return callback(err);
  });
};

ReceiverVolume.prototype.setVolume = function (volume, callback) {
  this.log.info(`${this.name} setVolume`);
  var volumeAdjustmentLoop = function(increase, target) {
    cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
    .then(function (res) {
      var currentVolume = 0x7f & res.status;

      if (increase && currentVolume < target) {
        cec.send('volup');
        setTimeout(volumeAdjustmentLoop, 300, true, target);
      } else if (!increase && currentVolume > target) {
        cec.send('voldown');
        setTimeout(volumeAdjustmentLoop, 300, false, target);
      } else {
        callback(null);
      }
    })
    .catch(function (err) {
      callback(err);
    });
  };

  cec.request(0xf5, 'GIVE_AUDIO_STATUS', 'REPORT_AUDIO_STATUS')
  .then(function (res) {
    let currentVolume = 0x7f & res.status;
    let increase = currentVolume < volume;
    volumeAdjustmentLoop(increase, volume);
  });
};

function increaseVolume() {
  cec.send('volup');
}

function volumeMap(x) {
  return 6.651e-5*x*x*x - 0.0006*x*x + 0.1389*x + 0.0199;
}
