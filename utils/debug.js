const config = require('../config');

if(config.loggingLevel <= 1)
module.exports =  config.loggingLevel > 1 ? () => {} : (...methods) => {
    console.log(...methods);
}