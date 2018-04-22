import * as moment from 'moment';
import { TelegramInlineKeyboardButton, TelegramMessage } from "../../../typings/telegram";
import { Database } from "../../utils/db";
import loop from "../../utils/loop";
import { IBotCommand } from "../bot-helpers";
import { button } from "../keyboard/keyboard";
import { KeyboardContext } from "../keyboard/keyboard-context";
import { IKeyboardHandler } from "../keyboard/keyboard-handler";
import { CallbackQueryOutput } from "../outputs/callback-query-output";
import { ChatIdOutput } from "../outputs/chat-id-output";
import { TelegramOutput } from "../outputs/telegram-output";
import { TelegramBot } from "../telegram-bot";
import { TelegramMessageContext } from "../telegram-message-context";

const dateIntervals: { [key: string]: [number, string] } = {
    minute: [1, 'minute'],
    '15minutes': [15, 'minute'],
    hour: [1, 'hour'],
    '5hours': [5, 'hour'],
    day: [1, 'day'],
    week: [1, 'week'],
    month: [1, 'month']
};
const BUTTON_ID = 'remind';
const defaultKeyboard: TelegramInlineKeyboardButton[][] = [
    [button('+1 minute', BUTTON_ID, 'add', 'minute'), button('-1 minute', BUTTON_ID, 'subtract', 'minute')],
    [button('+15 minutes', BUTTON_ID, 'add', '15minutes'), button('-15 minutes', BUTTON_ID, 'subtract', '15minutes')],
    [button('+1 hour', BUTTON_ID, 'add', 'hour'), button('-1 hour', BUTTON_ID, 'subtract', 'hour')],
    [button('+5 hours', BUTTON_ID, 'add', '5hours'), button('-5 hours', BUTTON_ID, 'subtract', '5hours')],
    [button('+1 day', BUTTON_ID, 'add', 'day'), button('-1 day', BUTTON_ID, 'subtract', 'day')],
    [button('Cancel', BUTTON_ID, 'cancel')]
];
const defaultKeyboardWithOk = [...Array.from(defaultKeyboard), [button('OK', BUTTON_ID, 'ok')]];

export class ReminderCommand implements IBotCommand, IKeyboardHandler {
    private registry: { [key: string]: Reminder } = {};
    private database: Database<ReminderDbObject>;
    private reminders: Reminder[] = [];
    constructor(private bot: TelegramBot) {
        this.database = new Database<ReminderDbObject>('reminders');
        this.database.load(() => {
            for (let entry of this.database)
                this.reminders.push(Reminder.fromDbObject(entry));
        });
        loop.subscribe(() => this.onUpdate());
    }
    getCallbackNames(): string | string[] {
        return BUTTON_ID;
    }
    getSlashCommands(): string | string[] {
        return 'reminder';
    }
    getHelpMessageText(): string | null {
        return 'Sets a custom reminder. Use \'/reminder [message]\' for a custom message.';
    }
    isGroupOnly(): boolean {
        return false;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput): void {
        let mom = moment();
        output.sendToChat(this.getText(mom), {
            reply: true,
            keyboard: defaultKeyboard,
            callback: (result: TelegramMessage) => {
                let key = this.getId(result);
                let reminder = new Reminder(
                    context.hasArguments ? context.args.join(' ') : 'You wanted me to remind you!',
                    mom,
                    context.message.chat.id,
                    context.message.from.id
                );
                this.registry[key] = reminder;
            }
        });
    }
    onQuery(query: KeyboardContext, output: CallbackQueryOutput): void | string {
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
        let currentTime: any = registry.moment;
        currentTime[command](timeAmount, timeInterval);
        output.editMessage(this.getText(currentTime), { keyboard: moment().isBefore(currentTime) ? defaultKeyboardWithOk : defaultKeyboard });
    }
    private submitReminder(context: KeyboardContext, output: CallbackQueryOutput) {
        let { query } = context;
        let { message } = query;
        let id = this.getId(message);
        let register = this.registry[id];
        if (!register) return;
        if (register.from != query.from.id) return;
        delete this.registry[id];
        let callback: string;
        if (!register)
            callback = 'Something went wrong. Try again!';
        else {
            this.addReminder(register);
            callback = `You will be reminded at ${this.parseDate(register.moment)}`;
        }
        output.editMessage(callback);
    }
    private addReminder(reminder: Reminder) {
        this.reminders.push(reminder);
        this.database.add(reminder.toDbObject());
        this.database.saveChanges();
    }
    private getText(moment: moment.Moment): string {
        return `When do you need me to remind you?\n${this.parseDate(moment)}`;
    }
    private parseDate(moment: moment.Moment): string {
        return moment.format('ddd D MMM YYYY HH:mm');
    }
    private getId(msg: TelegramMessage): string {
        return `${msg.chat.id}_${msg.message_id}`;
    }
    private onUpdate() {
        let now = moment();
        let notRemoved = [];
        let reminders = this.reminders;
        for (let i = reminders.length - 1; i >= 0; i--) {
            let entry = reminders[i];
            if (now.isAfter(entry.moment)) {
                let output = new ChatIdOutput(this.bot, entry.chat);
                output.sendToChat(entry.text);
                this.database.delete(entry.toDbObject());
                this.database.saveChanges();
                reminders.splice(i, 1);
            }
        };
    }
}

export class Reminder {
    constructor(
        public text: string,
        public moment: moment.Moment,
        public chat: number,
        public from: number
    ) { }
    toDbObject(): ReminderDbObject {
        return new ReminderDbObject(this.text, this.chat, this.moment.toISOString());
    }
    static fromDbObject(dbObject: ReminderDbObject): Reminder {
        return new Reminder(
            dbObject.text,
            moment(dbObject.time),
            dbObject.chat,
            -1
        );
    }
}
class ReminderDbObject {
    constructor(
        public text: string,
        public chat: number,
        public time: string
    ) { }
}