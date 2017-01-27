'use strict';

const packageConfig = require('../package.json');

const ReceiverPowerModule = require('./ReceiverPower');
const ReceiverPower = ReceiverPowerModule.ReceiverPower;

const ReceiverVolumeModule = require('./ReceiverVolume');
const ReceiverVolume = ReceiverVolumeModule.ReceiverVolume;

const TvPowerModule = require('./TvPower');
const TvPower = TvPowerModule.TvPower;

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
  TvPowerModule.setHomebridge(homebridge);

  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;
  Characteristic = homebridge.hap.Characteristic;
  homebridgeVersion = homebridge.version;
}

/*
 * CecPlatform
 */

class CecPlatform {

  constructor (log, config, api) {
    this.log = log;
    this.api = api;
    this.name = 'CecPlatform';
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
            this.addAccessory('Home Theater');
          }
        }.bind(this));
    }
  }
}

CecPlatform.prototype.configureAccessory = function(accessory) {
  this.log('configureAccessory');
  // set the accessory to reachable if plugin can currently process the accessory
  // otherwise set to false and update the reachability later by invoking
  accessory.updateReachability(true);

  if (accessory.context.type === 'ReceiverPower') {
    let rp = new ReceiverPower(accessory);
  } else if (accessory.context.type === 'ReceiverVolume') {
    let rv = new ReceiverVolume(accessory);
  } else if (accessory.context.type === 'TvPower') {
    let tp = new TvPower(accessory);
  }

  this.log(`reconfiguring existing ${accessory.context.type} accessory`);

  this.accessories.push(accessory);
};

CecPlatform.prototype.addAccessory = function(accessoryName) {
  // this.log('add accessory');

  let rp = new ReceiverPower(accessoryName);
  this.accessories.push(rp.accessory);

  let rv = new ReceiverVolume(accessoryName);
  this.accessories.push(rv.accessory);

  let tp = new TvPower(accessoryName);
  this.accessories.push(tp.accessory);

  this.api.registerPlatformAccessories('homebridge-platform-cec', 'CecPlatform', this.accessories);
};

module.exports = {
  CecPlatform: CecPlatform,
  setHomebridge: setHomebridge
};
