

class Service {

  constructor (config) {
    this.name = config.name;
    let destination = config.deviceAddress;
    let sender = config.senderAddress;

    this.addressByte = ((sender % 16) << 4) | (destination % 16);
  }

}
