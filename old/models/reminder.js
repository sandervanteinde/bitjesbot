const moment = require('moment');
/**
 * @alias models:Reminder
 */
class Reminder{
    /**
     * @param {string} text 
     * @param {moment:Moment} moment 
     * @param {number} chat 
     */
    constructor(text, moment, chat){
        this.text = text;
        this.moment = moment;
        this.chat = chat;
    }
    /**
     * @param {object} dbObj
     * @returns {Reminder}
     */
    static fromDbObject(dbObj){
        return new Reminder(
            dbObj.text,
            moment(dbObj.time),
            dbObj.chat
        );
    }
    /**
     * @returns {object}
     */
    toDbObject(){
        return {
            text: this.text,
            chat: this.chat,
            time: this.moment.toISOString()
        };
    }
}
module.exports = Reminder;