"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const keyboard_1 = require("../keyboard/keyboard");
const db_1 = require("../../utils/db");
const loop_1 = require("../../utils/loop");
const chat_id_output_1 = require("../outputs/chat-id-output");
const dateIntervals = {
    minute: [1, 'minute'],
    '15minutes': [15, 'minute'],
    hour: [1, 'hour'],
    '5hours': [5, 'hour'],
    day: [1, 'day'],
    week: [1, 'week'],
    month: [1, 'month']
};
const BUTTON_ID = 'remind';
const defaultKeyboard = [
    [keyboard_1.button('+1 minute', BUTTON_ID, 'add', 'minute'), keyboard_1.button('-1 minute', BUTTON_ID, 'subtract', 'minute')],
    [keyboard_1.button('+15 minutes', BUTTON_ID, 'add', '15minutes'), keyboard_1.button('-15 minutes', BUTTON_ID, 'subtract', '15minutes')],
    [keyboard_1.button('+1 hour', BUTTON_ID, 'add', 'hour'), keyboard_1.button('-1 hour', BUTTON_ID, 'subtract', 'hour')],
    [keyboard_1.button('+5 hours', BUTTON_ID, 'add', '5hours'), keyboard_1.button('-5 hours', BUTTON_ID, 'subtract', '5hours')],
    [keyboard_1.button('+1 day', BUTTON_ID, 'add', 'day'), keyboard_1.button('-1 day', BUTTON_ID, 'subtract', 'day')],
    [keyboard_1.button('Cancel', BUTTON_ID, 'cancel')]
];
const defaultKeyboardWithOk = [...Array.from(defaultKeyboard), [keyboard_1.button('OK', BUTTON_ID, 'ok')]];
class ReminderCommand {
    constructor(bot) {
        this.bot = bot;
        this.registry = {};
        this.reminders = [];
        this.database = new db_1.Database('reminders');
        this.database.load(() => {
            for (let entry of this.database)
                this.reminders.push(Reminder.fromDbObject(entry));
        });
        loop_1.default.subscribe(() => this.onUpdate());
    }
    getCallbackNames() {
        return BUTTON_ID;
    }
    getSlashCommands() {
        return 'reminder';
    }
    getHelpMessageText() {
        return 'Sets a custom reminder. Use \'/reminder [message]\' for a custom message.';
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        let mom = moment();
        output.sendToChat(this.getText(mom), {
            reply: true,
            keyboard: defaultKeyboard,
            callback: (result) => {
                let key = this.getId(result);
                let reminder = new Reminder(context.hasArguments ? context.args.join(' ') : 'You wanted me to remind you!', mom, context.message.chat.id, context.message.from.id);
                this.registry[key] = reminder;
            }
        });
    }
    onQuery(query, output) {
        let [command] = query.args;
        switch (command) {
            case 'cancel':
                output.editMessage('Cancelled');
                return;
            case 'ok':
                this.submitReminder(query, output);
                return;
        }
        let id = this.getId(query.query.message);
        let registry = this.registry[id];
        if (!registry) {
            output.editMessage('Something went wrong on our end');
            return;
        }
        let [, interval] = query.args;
        let [timeAmount, timeInterval] = dateIntervals[interval];
        let currentTime = registry.moment;
        currentTime[command](timeAmount, timeInterval);
        output.editMessage(this.getText(currentTime), { keyboard: moment().isBefore(currentTime) ? defaultKeyboardWithOk : defaultKeyboard });
    }
    submitReminder(context, output) {
        let { query } = context;
        let { message } = query;
        let id = this.getId(message);
        let register = this.registry[id];
        if (!register)
            return;
        if (register.from != query.from.id)
            return;
        delete this.registry[id];
        let callback;
        if (!register)
            callback = 'Something went wrong. Try again!';
        else {
            this.addReminder(register);
            callback = `You will be reminded at ${this.parseDate(register.moment)}`;
        }
        output.editMessage(callback);
    }
    addReminder(reminder) {
        this.reminders.push(reminder);
        this.database.add(reminder.toDbObject());
        this.database.saveChanges();
    }
    getText(moment) {
        return `When do you need me to remind you?\n${this.parseDate(moment)}`;
    }
    parseDate(moment) {
        return moment.format('ddd D MMM YYYY HH:mm');
    }
    getId(msg) {
        return `${msg.chat.id}_${msg.message_id}`;
    }
    onUpdate() {
        let now = moment();
        let notRemoved = [];
        let reminders = this.reminders;
        for (let i = reminders.length - 1; i >= 0; i--) {
            let entry = reminders[i];
            if (now.isAfter(entry.moment)) {
                let output = new chat_id_output_1.ChatIdOutput(this.bot, entry.chat);
                output.sendToChat(entry.text);
                this.database.delete(entry.toDbObject());
                this.database.saveChanges();
                reminders.splice(i, 1);
            }
        }
        ;
    }
}
exports.ReminderCommand = ReminderCommand;
class Reminder {
    constructor(text, moment, chat, from) {
        this.text = text;
        this.moment = moment;
        this.chat = chat;
        this.from = from;
    }
    toDbObject() {
        return new ReminderDbObject(this.text, this.chat, this.moment.toISOString());
    }
    static fromDbObject(dbObject) {
        return new Reminder(dbObject.text, moment(dbObject.time), dbObject.chat, -1);
    }
}
exports.Reminder = Reminder;
class ReminderDbObject {
    constructor(text, chat, time) {
        this.text = text;
        this.chat = chat;
        this.time = time;
    }
}
//# sourceMappingURL=reminder.command.js.map