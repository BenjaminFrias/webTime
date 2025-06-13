Object.assign(global, require('jest-chrome'));
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
