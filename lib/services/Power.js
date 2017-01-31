'use strict';

const cec = require('cec-promise');
const autobind = require('auto-bind');
const Service = require('./service');

class Power extends Service {

  constructor (config) {
    super(config);
    autobind(this);
  }

  getOn(callback) {
    cec.request(this.addressByte, 'GIVE_DEVICE_POWER_STATUS', 'REPORT_POWER_STATUS')
    .then(function (res) {
      var on = (res.status === 0) ? 1 : 0;
      console.log(`${this.name} getOn: ${on}`);
      return callback(null, on);
    }.bind(this))
    .catch(function (err) {
      console.log(err);
      return callback(err);
    });
  }

  setOn(on, callback) {
    this.getOn(function (err, isOn) {
      if (err !== null) {
        console.log(err);
        callback(err);
      } else {
        if (on === isOn) {
          console.log(`${this.name} setOn: already ${on ? 'on' : 'off'}`);
        } else {
          let newMode = isOn ? 'standby' : 'on';
          console.log(`${this.name} setOn: ${on}`);
          cec.send(`${newMode} ${this.deviceAddress}`);
        }
        callback(null);
      }
    }.bind(this));
  }
}
