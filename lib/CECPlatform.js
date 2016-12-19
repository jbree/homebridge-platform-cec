'use strict';

// const CECScannerModule = require('./CECScanner');
// const CECScanner = CECScannerModule.CECScanner;
const packageConfig = require('../package.json');

const ReceiverPowerModule = require('./ReceiverPower');
const ReceiverPower = ReceiverPowerModule.ReceiverPower;

const ReceiverVolumeModule = require('./ReceiverVolume');
const ReceiverVolume = ReceiverVolumeModule.ReceiverVolume;

/*
 * Homebridge
 */

let Accessory;
let Service;
let Characteristic;
let UUIDGen;
let homebridgeVersion;


function setHomebridge(homebridge) {
  ReceiverVolumeModule.setHomebridge(homebridge);
  ReceiverPowerModule.setHomebridge(homebridge);
  // CECScannerModule.setHomebridge(homebridge);
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;
  Characteristic = homebridge.hap.Characteristic;
  homebridgeVersion = homebridge.version;
}

/*
 * CECPlatform
 */

class CECPlatform {

  constructor (log, config, api) {
    this.log = log;
    this.api = api;
    this.name = 'CECPlatform';
    // this.name = config.name || 'CecPlatform';
    this.scanner = null;

    this.config = {}; // future

    this.log.info(`${packageConfig.name} v${packageConfig.version}, ` +
      `node ${process.version}, homebridge v${homebridgeVersion}`);

    this.accessories = [];

    if (api) {
        // Save the API object as plugin needs to register new accessory via this object.
        this.api = api;

        // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
        // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
        // Or start discover new accessories
        this.api.on('didFinishLaunching', function() {
          this.log.info('didFinishLaunching');
          if (this.accessories.length < 1) {
            this.addAccessory('Sony AV Amp');
          }
        }.bind(this));
    }
  }
}

CECPlatform.prototype.configureAccessory = function(accessory) {
  this.log('configureAccessory');
  // set the accessory to reachable if plugin can currently process the accessory
  // otherwise set to false and update the reachability later by invoking
  accessory.updateReachability(true);

  if (accessory.context.type === 'ReceiverPower') {
    let rp = new ReceiverPower(accessory);
  } else if (accessory.context.type === 'ReceiverVolume') {
    let rv = new ReceiverVolume(accessory);
  }

  this.accessories.push(accessory);
};

CECPlatform.prototype.addAccessory = function(accessoryName) {
  console.log('add accessory');

  let rp = new ReceiverPower(accessoryName);
  this.accessories.push(rp.accessory);

  let rv = new ReceiverVolume(accessoryName);
  this.accessories.push(rv.accessory);

  this.api.registerPlatformAccessories('homebridge-cec', 'CECPlatform', this.accessories);
};

module.exports = {
  CECPlatform: CECPlatform,
  setHomebridge: setHomebridge
};
