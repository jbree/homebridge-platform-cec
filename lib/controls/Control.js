class Control {

  /**
   * @param {Object} config
   * @param {String} config.name
   * @param {Number} config.deviceAddress 4-byte integer destination device address
   * @param {Number} config.senderAddress 4-byte integer sending device address
   */
  constructor (config) {
    this.name = config.name;
    let destination = config.deviceAddress;
    let sender = config.senderAddress;

    this.addressByte = ((sender % 16) << 4) | (destination % 16);
  }

}
