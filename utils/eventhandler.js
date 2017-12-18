const EventEmitter = require('events');
const Reminder = require('../models/reminder');
const config = require('../config');
const log = require('./log');

class EventHandler extends EventEmitter{
    constructor(){
        super();
        if(config.loggingLevel <= 1){
            this.emit = (evName, ...params) => {
                log.debug(`Emitting event [${evName}]`);
                super.emit(evName, ...params);
            };
        }
    }
}

module.exports = new EventHandler();