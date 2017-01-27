'use strict';

const cec = require('cec-promise');
const autobind = require('auto-bind');

class Tv {

  constructor () {
    autobind(this);

    this.name = 'TV';
  }

  getOn(callback) {
    cec.request(0xe0, 'GIVE_DEVICE_POWER_STATUS', 'REPORT_POWER_STATUS')
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
          cec.send(`${newMode} 0`);
        }
        callback(null);
      }
    }.bind(this));
  }
}

module.exports = new Tv();
