/**
 * @class Device
 * uses Control objects to provide desired functionality
 */
class Device {

  constructor (config) {
    this.name = config.name;

    let controlsConfig = config.controls;
    this.controls = {};


    controlsConfig.forEach(function (control) {
      if (control === 'power') {
        this.accessory = this.createAccessory(control);
        this.controls[control] = new Power(config);
        this.addService(control);
      }
    });
  }

  createAccessory (controlType) {
    console.log(`Create ${config.name} ${controlType} Accessory`);

    let uuid = UUIDGen.generate(config.name + controlType);
    let accessory = new Accessory(config.name + controlType, uuid);

    accessory.on('identify', function(paired, callback) {
      console.log(accessory.displayName, 'Identify!');
      callback();
    });

    accessory.reachable = true;

    return accessory;
  }

  addService(control) {
    let accessory = this.accessory;
    if (control === 'power') {
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


  }


}
