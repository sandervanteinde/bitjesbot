const bot = require('./bot');
const keyboard = require('../utils/keyboard');
const moment = require('moment');
require('moment-timezone');
const loop = require('../utils/loop');
const regex = /remind_(add|subtract)_([a-z0-9]+)/;
const db = require('../utils/db');
const Reminder = require('../models/reminder');
const log = require('../utils/log');
const dateIntervals = {
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
const reminders = [];
for(let val in dateIntervals) {
    keyboard.registerCallback(`remind_add_${val}`, onButtonPushed);
    keyboard.registerCallback(`remind_subtract_${val}`, onButtonPushed);
};
keyboard.registerCallback('remind_ok', onOk);
const defaultKeyboard = [
    [keyboard.button('+1 minute', 'remind_add_minute'),  keyboard.button('-1 minute', 'remind_subtract_minute')],
    [keyboard.button('+15 minutes', 'remind_add_15minutes'), keyboard.button('-15 minutes', 'remind_subtract_15minutes')],
    [keyboard.button('+1 hour', 'remind_add_hour'), keyboard.button('-1 hour', 'remind_subtract_hour')],
    [keyboard.button('+5 hours', 'remind_add_5hours'), keyboard.button('-5 hours', 'remind_subtract_5hours')],
    [keyboard.button('+1 day', 'remind_add_day'), keyboard.button('-1 day', 'remind_subtract_day')],
    /*[keyboard.button('+1 week', 'remind_add_week'), keyboard.button('-1 week', 'remind_subtract_week')],
    [keyboard.button('+1 month', 'remind_add_month'), keyboard.button('-1 month', 'remind_subtract_month')]*/
];
const defaultKeyboardWithOk = [...Array.from(defaultKeyboard), [keyboard.button('OK', 'remind_ok')]];

/**
 * @type {Object.<string, Reminder>}
 */
let registry = {};

bot.registerSlashCommand('reminder', 'Sets a custom reminder. Use \'/reminder [message]\' for a custom message.', (msg, slashCmd, ...params) => {
    let mom = moment();
    bot.sendMessage({
        chatId: msg.chat.id,
        message: getText(mom),
        replyId: msg.message_id,
        keyboard: defaultKeyboard,
        callback: result => {
            if(!result.ok) return;
            let registryKey = getId(result.result);
            registry[registryKey] = new Reminder(
                params.length > 0 && params.join(' ') || 'You wanted me to remind you!',
                mom,
                msg.chat.id
            );
            registry[registryKey].from = msg.from.id;
            log.debug(registry[registryKey]);
        }
    });
});

function getId(msg){
    return `${msg.chat.id}_${msg.message_id}`;
}
/**
 * 
 * @param {Moment} moment 
 */
function getText(moment){
    return `When do you need me to remind you?\n${parseDate(moment)}`;
}

function parseDate(moment){
    return moment.format('ddd D MMM YYYY HH:mm');
}

function onOk(msg){
    let id = getId(msg.message);
    let register = registry[id];
    if(!register) return;
    if(registry[id].from != msg.from.id) return;
    delete registry[id];
    msg.answered = true;
    let callback;
    if(!register)
        callback =  'Something went wrong. Try again!';
    else{
        reminders.push(register);
        db.getCollection('reminders', collection => {
            collection.add(register.toDbObject());
            collection.saveChanges();
        });
        callback = `You will be reminded at ${parseDate(register.moment)}`;
    }
    bot.answerCallbackQuery(msg.id, {callback: () => {
        bot.editMessage(msg.message.chat.id, msg.message.message_id, callback);
    }});
}

function onButtonPushed(msg){
    if(!msg.data){
        console.error('Something odd happened', msg);
        return;
    }
    let [match, addOrSub, method] = msg.data.match(regex);
    let options = dateIntervals[method];
    let id = getId(msg.message);
    if(!registry[id])
    {
        bot.answerCallbackQuery(msg.id, {callback: () => {
            bot.editMessage(msg.message.chat.id, msg.message.message_id, 'Something went wrong on our end. Try again!');
        }});
        return;
    }
    if(msg.from.id != registry[id].from)
        return;
    let currentTime = registry[id].moment;
    currentTime[addOrSub](...options);
    msg.answered = true;
    bot.answerCallbackQuery(msg.id, {callback: () => {
        bot.editMessage(msg.message.chat.id, msg.message.message_id, getText(currentTime), {
            keyboard: moment().isBefore(currentTime) && defaultKeyboardWithOk || defaultKeyboard
        });
    }});
}
db.getCollection('reminders', dbCollection => {
    dbCollection.items.forEach(item => {
        reminders.push(Reminder.fromDbObject(item));
    });
});
loop.subscribe(() => {
    let now = moment();
    let notRemoved = [];
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