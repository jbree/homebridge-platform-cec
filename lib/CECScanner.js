'use strict';

const ReceiverVolumeModule = require('./ReceiverVolume');
const ReceiverVolume = ReceiverVolumeModule.ReceiverVolume;

const ReceiverPowerModule = require('./ReceiverPower');
const ReceiverPower = ReceiverPowerModule.ReceiverPower;

const cec = require('cec-promise');
var Promise = require('promise');

module.exports = {
  setHomebridge: setHomebridge,
  CECScanner: CECScanner
};

/*
 * Homebridge
 */

let Accessory;
let Service;
let Characteristic;

function setHomebridge (homebridge) {
  ReceiverVolumeModule.setHomebridge(homebridge);
  ReceiverPowerModule.setHomebridge(homebridge);
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
}

/*
 * CECScanner
 */

function CECScanner (platform) {
  this.log = platform.log;
  this.platform = platform;
  this.name = 'cec-scanner';

  this.platform.log.info('Creating CECScanner');
}

CECScanner.prototype.accessories = function(callback) {
  let accessoryList = [];
  let name;

  cec.request(0xf5, 'GIVE_DEVICE_POWER_STATUS', 'REPORT_POWER_STATUS')
  .then(function (res) { // get device name
    return cec.request(0xf5, 'GIVE_OSD_NAME', 'SET_OSD_NAME');
  }.bind(this))
  .then(function (res) { // get device vendor
    name = String.fromCharCode.apply(this, res.packet.args);
    this.platform.log.info(`Receiver Name: ${name}`);
    return cec.request(0xf5, 'GIVE_DEVICE_VENDOR_ID', 'DEVICE_VENDOR_ID');
  }.bind(this))
  .then(function (res) {
    let b = res.packet.args;
    let vendorCode = b[0] << 16 | b[1] << 8 | b[2];
    let vendorName;
    let vendors = cec.code.VendorId;
    for(let vendor in vendors) {
      if (vendors[vendor] === vendorCode) {
        vendorName = vendor;
      }
    }

    this.platform.log.info(`Receiver Vendor: ${vendorName}`);

    let receiverVolume = new ReceiverVolume(this.platform, {name: `${name} Volume`, manufacturer: vendorName});
    accessoryList.push(receiverVolume);

    let receiverPower = new ReceiverPower(this.platform, {name:`${name} Power`, manufacturer: vendorName});
    accessoryList.push(receiverPower);
    
    return callback(accessoryList);
  }.bind(this))
  .catch(function (err) {
    this.platform.log.error(err);
    callback(accessoryList);
  }.bind(this));
};

/*
 * HomeKit Events
 */

CECScanner.prototype.identify = function () {
  this.log.info(`${this.name}.identify`);
};
