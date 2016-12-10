'use strict';

const request = require('request');
const util = require('util');

const CECScannerModule = require('./CECScanner');
const CECScanner = CECScannerModule.CECScanner;
const packageConfig = require('../package.json');

module.exports = {
  CECPlatform: CECPlatform,
  setHomebridge: setHomebridge
};

/*
 * Homebridge
 */

let Accessory;
let Service;
let Characteristic;
let homebridgeVersion;

function setHomebridge(homebridge) {
  CECScannerModule.setHomebridge(homebridge);
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridgeVersion = homebridge.version;
}

/*
 * CECPlatform
 */

function CECPlatform (log, config, api) {
  this.log = log;
  this.api = api;

  this.name = config.name;
  this.scanner = null;

  this.config = {}; // future

  this.log.info(`${packageConfig.name} v${packageConfig.version}, ` +
                `node ${process.version}, homebridge v${homebridgeVersion}`);
}

CECPlatform.prototype.findAccessories = function (callback) {

};

CECPlatform.prototype.accessories = function (callback) {
  const scanner = new CECScanner(this);
  let accessoryList = [];

  scanner.accessories(function (accessories) {
    if (accessories.length > 0) {
      this.scanner = scanner;
      for (const accessory of accessories) {
        accessoryList.push(accessory);
      }
    }
    return callback(accessoryList);
  }.bind(this));
};
