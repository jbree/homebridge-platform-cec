var nodecec = require('node-cec');
var NodeCEC = nodecec.NodeCec;

var Accessory, Service, Characteristic, UUIDGen;

var CECReceiver = require('./cec-receiver.js');

module.exports = function(homebridge) {
  console.log('homebridge API version: ' + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform('homebridge-plugin-cec', 'CECPlatform', CECPlatform, true);
};

function CECPlatform(log, config, api) {
  log('CECPlatform Init');
  var platform = this;
  this.log = log;
  this.config = config;
  this.accessories = [];

  this.cec = new NodeCEC('node-cec-monitor');
  this.receiver = new CECReceiver(this.cec);

  if (api) {
    // Save the API object as plugin needs to register new accessory via this object.
    this.api = api;

    // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
    // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
    // Or start discover new accessories
    this.api.on('didFinishLaunching', function() {
      platform.removeAccessory();

      platform.log('DidFinishLaunching');

      platform.log('Starting cec-client');

      this.cec.once('ready', function (client) {
        platform.receiver.getAudioStatus(function (status) {
          platform.log('Audio System Status: ' + (status ? 'on' : 'off'));
        });
      });

      this.cec.start( 'cec-client', '-m', '-d', '8', '-b', 'r' );

      this.receiver.onAudioStatusDidChange(function (status) {
        if (status === false) {
            platform.removeAccessory();
        } else {
            platform.addAccessory('Speaker');
        }
      });
    }.bind(this));
  }
}

// Function invoked when homebridge tries to restore cached accessory
// Developer can configure accessory at here (like setup event handler)
// Update current value
CECPlatform.prototype.configureAccessory = function(accessory) {
  this.log(accessory.displayName, 'Configure Accessory');
  var platform = this;

  // set the accessory to reachable if plugin can currently process the accessory
  // otherwise set to false and update the reachability later by invoking
  // accessory.updateReachability()
  accessory.reachable = true;

  accessory.on('identify', function(paired, callback) {
    platform.log(accessory.displayName, 'Identify!!!');
    callback();
  });

  var service = accessory.getService(Service.Lightbult);
  if (service) {
    service
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      platform.log(accessory.displayName, 'Speaker -> ' + value);
      this.receiver.setMute(value, function(status) {
        return callback();
      });
    });

    service
    .getCharacteristic(Characteristic.On)
    .on('get', function (callback) {
      this.receiver.getMute(function (status) {
        return callback(status);
      });
    });
  }

  this.accessories.push(accessory);
};

//Handler will be invoked when user try to config your plugin
//Callback can be cached and invoke when nessary
CECPlatform.prototype.configurationRequestHandler = function(context, request, callback) {
  this.log('Context: ', JSON.stringify(context));
  this.log('Request: ', JSON.stringify(request));

  // Check the request response
  if (request && request.response && request.response.inputs && request.response.inputs.name) {
    this.addAccessory(request.response.inputs.name);

    // Invoke callback with config will let homebridge save the new config into config.json
    // Callback = function(response, type, replace, config)
    // set "type" to platform if the plugin is trying to modify platforms section
    // set "replace" to true will let homebridge replace existing config in config.json
    // "config" is the data platform trying to save
    callback(null, 'platform', true, {'platform':'CECPlatform', 'otherConfig':'SomeData'});
    return;
  }

  // - UI Type: Input
  // Can be used to request input from user
  // User response can be retrieved from request.response.inputs next time
  // when configurationRequestHandler being invoked

  var respDict = {
    'type': 'Interface',
    'interface': 'input',
    'title': 'Add Accessory',
    'items': [
      {
        'id': 'name',
        'title': 'Name',
        'placeholder': 'Fancy Light'
      }//,
      // {
      //   'id': 'pw',
      //   'title': 'Password',
      //   'secure': true
      // }
    ]
  };

  // Plugin can set context to allow it track setup process
  context.ts = 'Hello';

  //invoke callback to update setup UI
  callback(respDict);
};

// Sample function to show how developer can add accessory dynamically from outside event
CECPlatform.prototype.addAccessory = function(accessoryName) {
  this.log('Add Accessory');
  var platform = this;
  var uuid;

  uuid = UUIDGen.generate(accessoryName);

  var accessory = new Accessory(accessoryName, uuid);
  accessory.on('identify', function(paired, callback) {
    platform.log(accessory.displayName, 'Identify!!!');
    callback();
  });
  // Plugin can save context on accessory
  // To help restore accessory in configureAccessory()
  // newAccessory.context.something = "Something"

  // Make sure you provided a name for service otherwise it may not visible in some HomeKit apps.
  var newService = accessory.addService(Service.Lightbulb, 'Speaker');

  newService
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    platform.log(accessory.displayName, 'Speaker -> ' + value);
    return platform.receiver.setMute(value, function () {
      callback(null);
    });
  });

  newService
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    platform.log('getMute');
    platform.receiver.getMute(function (mute) {
      callback(null, !mute);
    });
  });

  newService
  .getCharacteristic(Characteristic.Brightness)
  .on('set', function(value, callback) {
    platform.log(accessory.displayName, 'sV ->' + value);
    return platform.receiver.setVolume(value, function () {
      platform.log('sV cb');
      callback(null);
    });
  });

  newService
  .getCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
    platform.log('getVolume');
    platform.receiver.getVolume(function (volume) {
      platform.log('gV cb');
      return callback(null, volume);
    });
  });

  this.accessories.push(accessory);
  this.api.registerPlatformAccessories('homebridge-plugin-cec', 'CECPlatform', [accessory]);
};

CECPlatform.prototype.updateAccessoriesReachability = function() {
  this.log('Update Reachability');
  for (var index in this.accessories) {
    var accessory = this.accessories[index];
    accessory.updateReachability(true);
  }
};

// Sample function to show how developer can remove accessory dynamically from outside event
CECPlatform.prototype.removeAccessory = function() {
  this.log('Remove Accessory');
  this.api.unregisterPlatformAccessories('homebridge-plugin-cec', 'CECPlatform', this.accessories);

  this.accessories = [];
};
