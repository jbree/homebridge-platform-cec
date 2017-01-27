var Tv = require('./devices/Tv');

let Accessory;
let Service;
let Characteristic;

let type = 'TvPower';

function setHomebridge (homebridge) {
  Accessory = homebridge.platformAccessory;
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;
}

class TvPower {

  constructor(accessory) {
    if (accessory == null) {
      this.accessory = TvPower.createAccessory('TvPower');
    }
    if (typeof accessory === 'string') {
      this.accessory = TvPower.createAccessory(accessory);
    } else {
      this.accessory = accessory;
    }

    this.addServices();
  }

  setOn(on, callback) {
    Tv.setOn(on, function(err) {
      callback(err);
    });
  }

  getOn(callback) {
    Tv.getOn(function(err, on) {
      callback(err, on);
    });
  }

  addServices() {
    let accessory = this.accessory;
    let service = accessory.getService(Service.Lightbulb);

    if(!service) {
      console.log(`Adding power service to ${accessory.displayName}`);
      service = accessory.addService(Service.Lightbulb, 'Power');
    } else {
      console.log(`Updating power service to ${accessory.displayName}`);
    }

    service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getOn)
    .on('set', this.setOn);
  }

  static createAccessory(accessoryName) {
    console.log('Create TvPower Accessory');
    let uuid = UUIDGen.generate(type + accessoryName);

    let accessory = new Accessory(accessoryName, uuid);
    accessory.on('identify', function(paired, callback) {
      console.log(accessory.displayName, 'Identify!!!');
      callback();
    });

    accessory.context.type = type;
    accessory.reachable = true;

    return accessory;
  }
}

module.exports = {
  setHomebridge: setHomebridge,
  TvPower: TvPower
};
