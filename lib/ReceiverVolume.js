var Receiver = require('./devices/Receiver');

let Accessory;
let Service;
let Characteristic;

let type = 'ReceiverVolume';

function setHomebridge (homebridge) {
  Accessory = homebridge.platformAccessory;
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;
}

class ReceiverVolume {

  constructor(accessory) {
    if (accessory == null) {
      this.accessory = ReceiverVolume.createAccessory('ReceiverVolume');
    }
    if (typeof accessory === 'string') {
      this.accessory = ReceiverVolume.createAccessory(accessory);
    } else {
      this.accessory = accessory;
    }

    this.addServices();
  }

  setOn(on, callback) {
    Receiver.setMute((on === 1) ? 0 : 1, function(err) {
      callback(err);
    });
  }

  getOn(callback) {
    Receiver.getMute(function(err, mute) {
      callback(err, (mute === 1) ? 0 : 1);
    });
  }

  setBrightness(brightness, callback) {
    Receiver.setVolume(brightness, function(err) {
      callback(err);
    });
  }

  getBrightness(callback) {
    Receiver.getVolume(function (err, volume) {
      callback(err, volume);
    });
  }

  addServices() {
    let accessory = this.accessory;
    let service = accessory.getService(Service.Lightbulb);

    if(!service) {
      console.log(`Adding mute service to ${accessory.displayName}`);
      service = accessory.addService(Service.Lightbulb, 'Volume');
    } else {
      console.log(`Updating volume service to ${accessory.displayName}`);
    }

    service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getOn)
    .on('set', this.setOn);

    service
    .getCharacteristic(Characteristic.Brightness)
    .on('get', this.getBrightness)
    .on('set', this.setBrightness);
  }

  static createAccessory(accessoryName) {
    console.log('Create ReceiverVolume Accessory');
    let uuid = UUIDGen.generate(type + accessoryName);

    let accessory = new Accessory(accessoryName, uuid);
    accessory.on('identify', function(paired, callback) {
      console.log(accessory.displayName, 'Identify!!!');
      callback();
    });

    accessory.context.type = 'ReceiverVolume';
    accessory.reachable = true;

    return accessory;
  }
}

module.exports = {
  setHomebridge: setHomebridge,
  ReceiverVolume: ReceiverVolume
};
