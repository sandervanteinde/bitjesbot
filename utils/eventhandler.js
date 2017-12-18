const EventEmitter = require('events');
const Reminder = require('../models/reminder');

class EventHandler extends EventEmitter{
    /**
     * 
     * @param {Reminder} reminder 
     */
    emitNewReminder(reminder){
        this.emit('on-new-reminder', reminder);
    }
    /**
     * @param {function(Reminder):void} callback 
     */
    onNewReminder(callback){
        this.addListener('on-new-reminder', callback);
    }
}

module.exports = new EventHandler();