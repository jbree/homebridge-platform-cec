'use strict';

module.exports = {
  setHomebridge: setHomebridge,
  ReceiverPower: ReceiverPower
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

function ReceiverPower (platform, id) {
  this.log = platform.log;
  this.platform = platform;
  this.name = id.name;
  this.type = 'ReceiverPower';
  this.manufacturer = id.manufacturer;

  this.log.info(`Creating ${id.manufacturer} ${this.type} named ${id.name}`);

  this.infoService = new Service.AccessoryInformation();
  this.infoService
    .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
    .setCharacteristic(Characteristic.Model, `${this.name}`)
    .setCharacteristic(Characteristic.SerialNumber, '2345');

  this.service = new Service.Switch(`${this.name} ${this.type}`);

  this.service.getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));
}

ReceiverPower.prototype.getServices = function () {
  return [this.service, this.infoService];
};


// ===== Homekit Events ==================================================================

ReceiverPower.prototype.identify = function (callback) {
  this.log.info(`${this.name} ${this.type}: identify`);
  //FIXME
  return callback();
};

ReceiverPower.prototype.getOn = function (callback) {
  cec.request(0xf5, 'GIVE_DEVICE_POWER_STATUS', 'REPORT_POWER_STATUS')
  .then(function (res) {
    var on = res.status === 0 ? 1 : 0;
    this.log.info(`${this.name} ${this.type} getOn: ${on}`);
    return callback(null, on);
  }.bind(this))
  .catch(function (err) {
    this.log.err(err);
    return callback(err);
  }.bind(this));
};

ReceiverPower.prototype.setOn = function (on, callback) {
  this.getOn(function (err, isOn) {
    if (err !== null) {
      this.log.error(err);
      callback(err);
    } else {
      if (on === isOn) {
        this.log.info(`${this.name} setOn: already ${on ? 'on' : 'off'}`);
      } else {
        let newMode = isOn ? 'standby' : 'on';
        this.log.info(`${this.name} ${this.type} setOn: ${on}`);
        cec.send(`${newMode} 5`);
      }
      callback(null);
    }
  }.bind(this));
};
