var nodecec = require('node-cec');
var CEC = nodecec.CEC;

function CECReceiver (cec) {

  /**
   * send the amp's mute status to `mute`
   * @param {Boolean}   mute mute status
   * @param {Function}  cb   callback, no parameters
   */
  this.setMute = function (mute, cb) {
    return cecGetMute(function (currentMute) {
      if (currentMute !== mute) {
        cecToggleMute();
      }
    });

  };

  /**
   * get the amp's mute status
   * @param  {Function} cb callback, receives status bool as parameter
   */
  this.getMute = function (cb) {
    return cecGetMute(cb);
  };

  /**
   * set the receiver's volume
   * @param {Number}   volume integer volume target value
   * @param {Function} cb     callback, no parameters
   */
  this.setVolume = function (volume, cb) {
    return targetVolume(volume, cb);
  };

  /**
   * get the receiver's volume
   * @param  {Function} cb callback, receives volume value as parameters
   */
  this.getVolume = function (cb) {
    return cecGetVolume(cb);
  };

  /**
   * get the System Audio Mode Status of the receiver
   * @param  {Function} cb callback, receives audio mode status bool parameter
   */
  this.getAudioStatus = function (cb) {
    cec.once('SYSTEM_AUDIO_MODE_STATUS', function (packet, status) {
      if (cb != null) {
        return cb(status === 1);
      }
    });

    cec.sendCommand(0xf5, CEC.Opcode.GIVE_SYSTEM_AUDIO_MODE_STATUS);
  };

  /**
   * callback when audio status changes
   * @param  {Function} cb callback, receives audio mode status bool parameter
   */
  this.onAudioStatusDidChange = function (cb) {
    cec.on('SET_SYSTEM_AUDIO_MODE', function (packet, status) {
      if (cb != null) {
        return cb(status === 1);
      }
    });
  };

  function targetVolume (volume, cb) {
    cecGetVolume(function (currentVolume) {
      if (currentVolume === volume) {
        if (cb != null) {
          return cb();
        }
      } else if (currentVolume < volume) {
        incrementVolume(function () {
          return targetVolume(volume, cb);
        });
      } else {
        decrementVolume(function () {
          return targetVolume(volume, cb);
        });
      }
    });
  }

  function incrementVolume (cb) {
    cec.once('USER_CONTROL_RELEASE', function (packet, status) {
      if (cb != null) {
        cb();
      }
    });

    cec.send('volup');
  }

  function decrementVolume (cb) {
    cec.once('USER_CONTROL_RELEASE', function (packet, status) {
      if (cb != null) {
        cb();
      }
    });

    cec.send('voldown');
  }

  function cecGetVolume (cb) {

    cec.once('REPORT_AUDIO_STATUS', function(packet, status) {
      if (cb != null) {
        var currentVolume = 0x7f & status;
        console.log('volume: ' + currentVolume);
        if (cb != null) {
          return cb(currentVolume);
        }
      }
    });

    cec.sendCommand(0xf5, CEC.Opcode.GIVE_AUDIO_STATUS);
  }

  function cecGetMute (cb) {

    cec.once('REPORT_AUDIO_STATUS', function(packet, status) {
      if (cb != null) {
        var currentMute = (0x80 & status) > 0;
        cb(currentMute);
      }
    });

    cec.sendCommand(0xf5, CEC.Opcode.GIVE_AUDIO_STATUS);

  }

  function cecToggleMute() {
    cec.send('mute');
  }

}

module.exports = CECReceiver;
