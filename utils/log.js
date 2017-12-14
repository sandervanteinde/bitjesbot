const config = require('../config');
if(config.loggingLevel > 1)
    exports.debug = (...params) => {}
else
    exports.debug = (...params) => console.log(...params);

exports.info = console.log;

