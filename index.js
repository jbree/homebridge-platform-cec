'use strict';

const dynamic = true;

const CecPlatformModule = require('./lib/CecPlatform');
const CecPlatform = CecPlatformModule.CecPlatform;

module.exports = function(homebridge) {
  CecPlatformModule.setHomebridge(homebridge);
  homebridge.registerPlatform('homebridge-platform-cec', 'CecPlatform', CecPlatform, dynamic);
};
