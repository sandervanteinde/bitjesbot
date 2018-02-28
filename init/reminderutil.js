const bot = require('./bot');
const keyboard = require('../utils/keyboard');
const moment = require('moment');
require('moment-timezone');
const loop = require('../utils/loop');
const regex = /remind_(add|subtract)_([a-z0-9]+)/;
const db = require('../utils/db');
const Reminder = require('../models/reminder');
const log = require('../utils/log');
const ws = require('../utils/web/websocket');
const config = require('../config');
const EventHandler = require('../utils/eventhandler');

class ReminderUtil{
    /**
     * @returns {number}
     */
    get pendingRequests(){
        return this.reminders.length;
    }
    constructor(){
        this.dateIntervals = {
            minute: [1, 'minute'],
            '15minutes': [15, 'minute'],
            hour: [1, 'hour'],
            '5hours': [5, 'hour'],
            day: [1, 'day'],
            week: [1, 'week'],
            month: [1, 'month']
        };
        /**
         * @type {Reminder[]}
         */
        this.reminders = [];
        for(let val in this.dateIntervals) {
            keyboard.registerCallback(`remind_add_${val}`, (...params) => this.onButtonPushed(...params));
            keyboard.registerCallback(`remind_subtract_${val}`, (...params) => this.onButtonPushed(...params));
            keyboard.registerCallback('remind_cancel', (...params) => this.onButtonPushed(...params))
        };
        keyboard.registerCallback('remind_ok', (...params) => this.onOk(...params));
        this.defaultKeyboard = [
            [keyboard.button('+1 minute', 'remind_add_minute'),  keyboard.button('-1 minute', 'remind_subtract_minute')],
            [keyboard.button('+15 minutes', 'remind_add_15minutes'), keyboard.button('-15 minutes', 'remind_subtract_15minutes')],
            [keyboard.button('+1 hour', 'remind_add_hour'), keyboard.button('-1 hour', 'remind_subtract_hour')],
            [keyboard.button('+5 hours', 'remind_add_5hours'), keyboard.button('-5 hours', 'remind_subtract_5hours')],
            [keyboard.button('+1 day', 'remind_add_day'), keyboard.button('-1 day', 'remind_subtract_day')],
            [keyboard.button('Cancel', 'remind_cancel')]
            /*[keyboard.button('+1 week', 'remind_add_week'), keyboard.button('-1 week', 'remind_subtract_week')],
            [keyboard.button('+1 month', 'remind_add_month'), keyboard.button('-1 month', 'remind_subtract_month')]*/
        ];
        this.defaultKeyboardWithOk = [...Array.from(this.defaultKeyboard), [keyboard.button('OK', 'remind_ok')]];

        /**
         * @type {Object.<string, Reminder>}
         */
        this.registry = {};

        bot.registerSlashCommand('reminder', 'Sets a custom reminder. Use \'/reminder [message]\' for a custom message.', (msg, slashCmd, ...params) => {
            let mom = moment();
            bot.sendMessage({
                chatId: msg.chat.id,
                message: this.getText(mom),
                replyId: msg.message_id,
                keyboard: this.defaultKeyboard,
                callback: result => {
                    if(!result.ok) return;
                    let registryKey = this.getId(result.result);
                    let reminder = new Reminder(
                        params.length > 0 && params.join(' ') || 'You wanted me to remind you!',
                        mom,
                        msg.chat.id
                    );
                    reminder.from = msg.from.id;
                    this.registry[registryKey] = reminder;
                }
            });
        });
        db.getCollection('reminders', dbCollection => {
            dbCollection.items.forEach(item => {
                this.reminders.push(Reminder.fromDbObject(item));
            });
        });
        loop.subscribe(() => {
            let now = moment();
            let notRemoved = [];
            let reminders = this.reminders;
            for(let i = reminders.length - 1; i >= 0; i--){
                let entry = reminders[i];
                if(now.isAfter(entry.moment)){
                    bot.sendMessage({
                        chatId: entry.chat,
                        message: entry.text
                    });
                    db.getCollection('reminders', collection => {
                        collection.delete(entry.toDbObject());
                        collection.saveChanges();
                    });
                    reminders.splice(i, 1);
                }
            };
        });
        moment.tz.setDefault('Europe/Amsterdam');
        ws.registerCallback('add-reminder', (conn, content, key) => {
            if(!conn.id) return;
            let mom = moment(content.date);
            let split = content.time.split(':');
            mom.add(split[0], 'hour');
            mom.add(split[1], 'minute');
            let reminder = new Reminder(content.text, mom, conn.id);
            this.addReminder(reminder);
        });
    }
    getId(msg){
        return `${msg.chat.id}_${msg.message_id}`;
    }
    /**
     * 
     * @param {Moment} moment 
     */
    getText(moment){
        return `When do you need me to remind you?\n${this.parseDate(moment)}`;
    }

    parseDate(moment){
        return moment.format('ddd D MMM YYYY HH:mm');
    }
    /**
     * 
     * @param {Reminder} reminder 
     */
    addReminder(reminder){
        this.reminders.push(reminder);
        db.getCollection('reminders', collection => {
            collection.add(reminder.toDbObject());
            collection.saveChanges();
            EventHandler.emit('new-reminder', reminder);
        });
    }
    onOk(msg){
        let id = this.getId(msg.message);
        let register = this.registry[id];
        if(!register) return;
        if(register.from != msg.from.id) return;
        delete this.registry[id];
        msg.answered = true;
        let callback;
        if(!register)
            callback =  'Something went wrong. Try again!';
        else{
            this.addReminder(register);
            callback = `You will be reminded at ${this.parseDate(register.moment)}`;
        }
        bot.answerCallbackQuery(msg.id, {callback: () => {
            bot.editMessage(msg.message.chat.id, msg.message.message_id, callback);
        }});
    }

    onButtonPushed(msg){
        if(!msg.data){
            console.error('Something odd happened', msg);
            return;
        }
        if(msg.data == 'remind_cancel'){
            bot.answerCallbackQuery(msg.id, {callback: () => {
                bot.editMessage(msg.message.chat.id, msg.message.message_id, 'Reminder cancelled');
            }});
            return;
        }
        let [match, addOrSub, method] = msg.data.match(regex);
        let options = this.dateIntervals[method];
        let id = this.getId(msg.message);
        let registry = this.registry[id];
        if(!registry)
        {
            bot.answerCallbackQuery(msg.id, {callback: () => {
                bot.editMessage(msg.message.chat.id, msg.message.message_id, 'Something went wrong on our end. Try again!');
            }});
            return;
        }
        if(msg.from.id != registry.from)
            return;
        let currentTime = registry.moment;
        currentTime[addOrSub](...options);
        msg.answered = true;
        bot.answerCallbackQuery(msg.id, {callback: () => {
            bot.editMessage(msg.message.chat.id, msg.message.message_id, this.getText(currentTime), {
                keyboard: moment().isBefore(currentTime) && this.defaultKeyboardWithOk || this.defaultKeyboard
            });
        }});
    }
    /**
     * @param {number} id 
     * @returns {Reminder[]}
     */
    getRemindersForId(id){
        let arr = [];
        for(let reminder of this.reminders)
            if(reminder.chat == id)
                arr.push(reminder);
        return arr;
    }
}
module.exports = new ReminderUtil();