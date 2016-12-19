'use strict';

const dynamic = true;

const CECPlatformModule = require('./lib/CECPlatform');
const CECPlatform = CECPlatformModule.CECPlatform;

module.exports = function(homebridge) {
  CECPlatformModule.setHomebridge(homebridge);
  homebridge.registerPlatform('homebridge-cec', 'CECPlatform', CECPlatform, dynamic);
};
