const bot = require('./bot');
const keyboard = require('../utils/keyboard');
const db = require('../utils/db');
const moment = require('moment');
const loop = require('../utils/loop');
/**
 * @type {Object<number, Schedule[]>}
 */
const schedules = {};
/**
 * @type {Object<number,Schedule>}
 */
let inProgressSchedules = {};
/**
 * @type {Task[]}
 */
let tasks = [];
class Schedule {
    /**
     * @param {number} user 
     */
    constructor(user) {
        this.user = user;
        /**
         * @type {string}
         */
        this.name = undefined;
        /**
         * @type {'min'|'hour'|'day'|'weekdays'|'weekend'}
         */
        this.interval = undefined;
        this.intervalArg = undefined;
        this.slashCmd = undefined;
        this.active = true;
    }
}
class Task {

    /**
     * @param {Schedule} schedule 
     */
    constructor(schedule) {
        this.schedule = schedule;
        let now = moment();
        now.add(-now.seconds(), 'seconds');
        now.add(-now.milliseconds(), 'milliseconds');
        let hour, min, day;
        switch (schedule.interval) {
            case 'min':
                now.add(1, 'minute');
                break;
            case 'hour':
                min = Number(schedule.intervalArg);
                let currentMin = now.minute();
                if (min > currentMin) {
                    now.add(min - currentMin, 'minute');
                } else {
                    now.add(min - currentMin, 'minute').add('1', 'hour');
                }
                break;
            case 'day':
                [hour, min] = this.parseHour(schedule.intervalArg);
                this.setMomentTimeAndHour(now, hour, min);
                break;
            case 'weekdays':
                [hour, min] = this.parseHour(schedule.intervalArg);
                this.setMomentTimeAndHour(now, hour, min);
                day = now.day();
                if (day == 5)
                    now.add(2, 'days');
                else if (day == 6)
                    now.add(1, 'days');
                break;
            case 'weekend':
                [hour, min] = this.parseHour(schedule.intervalArg);
                this.setMomentTimeAndHour(now, hour, min);
                day = now.day();
                if (day > 0 && day <= 5)//su = 0, mo = 1, etc
                    now.add(6 - day, 'days');
                break;
        }
        this.next = now;
    }
    /**
     * 
     * @param {moment.Moment} mom 
     * @param {number} hour 
     * @param {number} minutes 
     */
    setMomentTimeAndHour(mom, hour, minutes) {
        mom.add(hour - mom.hour(), 'hour');
        mom.add(minutes - mom.minute(), 'minute');
        if (moment().isAfter(mom))
            mom.add(1, 'day');
    }
    /**
     * @param {string} input
     * @returns {[number,number]}
     */
    parseHour(input) {
        let [hour, min] = input.split(':');
        return [Number(hour), Number(min)];
    }
}


class Scheduler {
    constructor() {
        bot.registerSlashCommand('scheduler', 'Schedules slash commands', (...params) => this.onScheduler(...params), { privateOnly: true });
        keyboard.registerCallback('schedule', (query, command, params) => this.onButtonPressed(query, command, ...params));
        db.getCollection('scheduler', coll => {

            this.db = coll;
            /**
             * @type {Schedule[]}
             */
            let items = coll.items;
            for (let item of items) {
                this.addSchedule(item, false);
            }
        });
        loop.subscribe(() => {
            this.checkTasks();
        });
    }
    checkTasks() {
        if (tasks.length == 0) return;
        let now = moment();
        let task = tasks[0];
        while (task != null && task.next.isBefore(now)) {

            bot.interpretSlashCommand({
                from: {
                    id: task.schedule.user
                },
                chat: {
                    id: task.schedule.user,
                    type: 'private',
                },
                text: task.schedule.slashCmd
            });
            
            tasks.splice(0, 1);
            switch (task.schedule.interval) {

                case 'min': task.next.add(1, 'minute'); break;
                case 'hour': task.next.add(1, 'hour'); break;
                case 'day': task.next.add(1, 'day'); break;
                case 'weekdays':
                    let weekday = task.next.day();
                    task.next.add(weekday == 5 ? 3 : 1, 'days');
                    break;
                case 'weekend':
                    let weekendday = task.next.day();
                    task.next.add(weekendday == 0 ? 6 : 1, 'days');
                    break;
            }
            this.insertTask(task);
            task = tasks[0];
        }
    }
    /**
     * @param {Task} task 
     */
    insertTask(task) {
        if (tasks.length > 0) {
            for (let i = 0; i < tasks.length; i++) {
                let currentT = tasks[i];
                if (currentT.next.isAfter(task.next)) {
                    tasks.splice(i, 0, task);
                    return;
                }
            }
        }
        tasks.push(task);
    }

    getMainMenuKeyboard(){
        return [[
            keyboard.button('Add schedule', 'schedule', 'add'),
        ],[
            keyboard.button('Manage schedules', 'schedule', 'manage')
        ]];
    }

    /**
     * @param {TelegramMessage} message 
     */
    onScheduler(message) {
        bot.sendMessage({
            message: 'Organise your schedule here:',
            chatId: message.chat.id,
            keyboard: this.getMainMenuKeyboard()
        });
    }
    /**
     * 
     * @param {number} userId 
     * @param {Schedule} schedule 
     * @param {boolean} save
     */
    addSchedule(schedule, save = true) {
        let userArr = (schedules[schedule.user] = schedules[schedule.user] || []);
        userArr.push(schedule);
        if (schedule.active)
            this.insertTask(new Task(schedule));
        if (save) {
            this.db.add(schedule);
            this.db.saveChanges();
        }
    }

    /**
     * @param {TelegramInlineQuery} query 
     */
    onAddSchedule(query) {
        inProgressSchedules[query.from.id] = new Schedule(query.from.id);
        bot.sendMessage({
            chatId: query.from.id,
            message: 'Ok. Reply to me the description of the new schedule.',
            forceReplyHandler: (msg) => {
                inProgressSchedules[msg.from.id].name = msg.text;
                bot.sendMessage({
                    chatId: msg.from.id,
                    message: 'At what interval do you want this to happen?',
                    replyId: msg.message_id,
                    keyboard: [[
                        keyboard.button('Minutely', 'schedule', 'new_interval', 'min'),
                        keyboard.button('Hourly', 'schedule', 'new_interval', 'hour')
                    ], [
                        keyboard.button('Daily', 'schedule', 'new_interval', 'day')
                    ], [
                        keyboard.button('Week days (Mo-Fr)', 'schedule', 'new_interval', 'weekdays'),
                        keyboard.button('Weekend days (Sa+Su)', 'schedule', 'new_interval', 'weekend')
                    ]]
                });
            }
        })
    }
    /**
     * 
     * @param {TelegramInlineQuery} query 
     * @param {'min'|'hour'|'day'|'weekdays'|'weekend'} arg 
     */
    onNewInterval(query, arg) {
        if (!inProgressSchedules[query.from.id])
            return;
        inProgressSchedules[query.from.id].interval = arg;
        let reqInput;
        switch (arg) {
            case 'hour':
                reqInput = 'At what minute during each hour do you want this to happen? [0-59]';
                break;
            case 'day':
            case 'week':
            case 'weekdays':
            case 'weekend':
                reqInput = 'At what time during the day do you want this to happen?\nUse a 24-hour clock notation. Example inputs\n00:01\n15:59\n23:09';
                break;
        }

        let sendSlashCommandReq = (msgId) => {
            bot.sendMessage({
                chatId: query.from.id,
                message: `What slash command do you want to do at this hour?. For example: '/anwb a1'`,
                replyId: msgId,
                forceReplyHandler: (msg) => {
                    inProgressSchedules[msg.from.id].slashCmd = msg.text;
                    bot.sendMessage({
                        chatId: msg.from.id,
                        message: `And we're done! Your scheduled slash command is active now.`
                    });
                    this.addSchedule(inProgressSchedules[msg.from.id]);
                    delete inProgressSchedules[msg.from.id];
                }
            })
        }

        if (reqInput) {
            bot.sendMessage({
                chatId: query.from.id,
                message: reqInput,
                forceReplyHandler: (msg) => {
                    inProgressSchedules[query.from.id].intervalArg = msg.text;
                    sendSlashCommandReq(msg.message_id);
                }
            });
        } else {
            sendSlashCommandReq(undefined)
        }
        bot.editMessage(query.from.id, query.message.message_id, query.message.text, { keyboard: [[]] });
    }
    /**
     * @param {TelegramInlineQuery} query 
     */
    onManageSchedules(query){
        let items = schedules[query.from.id];
        if(!items || items.length == 0){
            return 'You have no schedules to edit.';
        }else{
            let buttons = [];
            for(let i = 0; i < items.length; i++){
                let item = items[i];
                buttons.push(keyboard.button(item.name, 'schedule', 'manage-item', i));
            }
            buttons = keyboard.formatButtons(buttons);
            buttons.push([keyboard.button('Return', 'schedule', 'main-menu')]);
            bot.editMessage(query.from.id, query.message.message_id, 'Click the schedule you would like to edit.', {keyboard:  buttons});
        }
    }
    /**
     * @param {TelegramInlineQuery} query 
     */
    onManageItem(query, id){
        let item = schedules[query.from.id][id];
        let buttons = [/*[
            keyboard.button('Edit description', 'schedule', 'edit-description', id),
            keyboard.button('Edit slash command', 'schedule', 'edit-slashcommand', id)
        ],*/[
            keyboard.button('Delete', 'schedule', 'delete', id)
        ],[
            keyboard.button('Return', 'schedule', 'manage')
        ]];
        bot.editMessage(query.from.id, query.message.message_id, `Editing *${item.name}*\nSlash command: *${item.slashCmd}*`, {
            keyboard: buttons,
            parse_mode: 'Markdown'
        });
    }
    /**
     * @param {Schedule} schedule 
     */
    removeTaskForSchedule(schedule){
        for(let i = 0; i < tasks.length; i++){
            if(tasks[i].schedule == schedule){
                tasks.splice(i, 1);
                return;
            }
        }
    }
    /**
     * 
     * @param {TelegramInlineQuery} query 
     * @param {string} id 
     */
    onDelete(query, id){
        let entries = schedules[query.from.id];
        if(!entries) return;
        let [entry] = entries.splice(Number(id), 1);
        this.db.delete(entry);
        this.db.saveChanges();
        if(entry.active){
            this.removeTaskForSchedule(entry);
        }
        if(this.onButtonPressed(query, '', 'manage'))
            this.onButtonPressed(query, '', 'main-menu');
    }
    /**
     * @param {TelegramInlineQuery} query 
     */
    onMainMenu(query){
        bot.editMessage(query.from.id, query.message.message_id, 'Select an option below', {
            keyboard: this.getMainMenuKeyboard()
        });
    }
    /**
     * 
     * @param {TelegramInlineQuery} query 
     * @param {string} command 
     * @param {string} parameter 
     */
    onButtonPressed(query, command, parameter, ...args) {
        switch (parameter) {
            case 'add':
                return this.onAddSchedule(query);
            case 'manage':
                return this.onManageSchedules(query);
            case 'manage-item':
                return this.onManageItem(query, ...args);
            case 'new_interval':
                return this.onNewInterval(query, ...args)
            case 'main-menu':
                return this.onMainMenu(query);
            case 'delete':
                return this.onDelete(query, ...args);

        }
    }
}
module.exports = undefined;
