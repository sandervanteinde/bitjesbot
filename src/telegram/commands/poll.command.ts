import { IBotCommand } from "../bot-helpers";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramOutput } from "../outputs/telegram-output";
import config from "../../utils/config";
import { button, formatButtons } from "../keyboard/keyboard";
import { IKeyboardHandler } from "../keyboard/keyboard-handler";
import { KeyboardContext } from "../keyboard/keyboard-context";
import { CallbackQueryOutput } from "../outputs/callback-query-output";
import { ChatIdOutput } from "../outputs/chat-id-output";
import { TelegramBot } from "../telegram-bot";
import { Database } from "../../utils/db";
import { TelegramInlineKeyboardButton, TelegramUser } from "../../../typings/telegram";
import { MessageIdOutput } from "../outputs/message-id-output";
import { parseUsername } from "../../utils/utils";

class PollEntry {
    public question: string = '';
    public answers: string[] = ['Yes', 'No'];
    get ChatName(): string { return this.chatName; }
    get ChatId(): number { return this.chatId; }
    constructor(private chatId: number, private chatName: string) {
    }
}
class PollDatabaseEntry {
    public voted: { [userId: number]: number } = {};
    constructor(
        public messageId: number,
        public chatId: number,
        public question: string,
        public answers: string[]
    ) { }
}

export class PollCommand implements IBotCommand, IKeyboardHandler {
    private db: Database<PollDatabaseEntry>;
    constructor(
        private bot: TelegramBot
    ) {
        this.db = new Database<PollDatabaseEntry>('polls');
        this.db.load();
    }
    getCallbackNames(): string | string[] {
        return 'poll';
    }
    private entries: { [key: string]: PollEntry } = {};
    getSlashCommands(): string | string[] {
        return 'poll';
    }
    getHelpMessageText(): string | (string | null)[] | null {
        return 'Starts a simple yes/no poll';
    }
    isGroupOnly(): boolean {
        return true;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput): void {
        output.sendToFrom('What is the question of the poll?', {
            callback: (msg) => {
                output.sendToChat('A message was sent privately to set up the poll.', { reply: true });
                this.entries[context.message.from.id] = new PollEntry(context.message.chat.id, context.message.chat.title);
            },
            error: (err) => {
                output.sendToChat(err.error_code == 403 ? `I can't send you a private message. Start the bot first at @${config.botName}` : 'Something went wrong. Contact the admin of this bot!', { reply: true });
            },
            forceReply: (c, o) => this.onPollQuestionReceived(c, o)
        });
    }
    onQuery(query: KeyboardContext, output: CallbackQueryOutput): string | void {
        let [command] = query.args;
        switch (command) {
            case 'confirm':
                let entry = this.entries[query.query.from.id];
                if (!entry) {
                    return output.editMessage('Something went wrong.');
                }
                let [, yesOrNo] = query.args;
                if (yesOrNo == 'yes') {
                    let chatOutput = new ChatIdOutput(this.bot, entry.ChatId);
                    chatOutput.sendToChat(`A new poll was created:\n${entry.question}`, {
                        callback: msg => {
                            let dbEntry = new PollDatabaseEntry(msg.message_id, entry.ChatId, entry.question, entry.answers);
                            this.db.add(dbEntry);
                            this.db.saveChanges();
                        },
                        keyboard: this.constructKeyboardForEntry(entry.answers)
                    });
                    output.editMessage(`Your poll was sent to: ${entry.ChatName}`);
                } else {
                    output.editMessage('Poll making cancelled');
                }
                delete this.entries[query.query.from.id];
                break;
            case 'answer':
                let dbEntry = this.db.firstOrVoid(c => c.chatId == query.query.message.chat.id && c.messageId == query.query.message.message_id);
                if (!dbEntry) {
                    return output.editMessage('This poll is in an invalid state');
                }
                let [, answer] = query.args;
                let from = query.query.from.id;
                let index = dbEntry.answers.indexOf(answer);
                if (dbEntry.voted[from]) {
                    if (dbEntry.voted[from] == index)
                        return 'You already voted this!';
                    else {
                        dbEntry.voted[from] = index;
                        this.modifyMessageToReflectVotes(dbEntry);
                        return `Changed your vote to ${dbEntry.answers[index]}`;
                    }
                } else {
                    dbEntry.voted[from] = index;
                    this.modifyMessageToReflectVotes(dbEntry);
                    return `You voted ${dbEntry.answers[index]}`;
                }
        }
    }
    private modifyMessageToReflectVotes(entry: PollDatabaseEntry) {
        this.db.saveChanges();
        let context = new MessageIdOutput(this.bot, entry.messageId, entry.chatId);
        let msg = `Poll: ${entry.question}\n\nVotes:`;
        let obj: number[] = [];
        let users: { [userId: number]: TelegramUser } = {};
        let count = 0;
        let callback : (() => void | void);
        for (let userId in entry.voted) {
            if (!obj[entry.voted[userId]]) obj[entry.voted[userId]] = 0;
            obj[entry.voted[userId]]++;
            count++;
            this.bot.getUserInGroup(entry.chatId, Number(userId), (user) => { 
                if (user) 
                    users[userId] = user; 
                count--; 
                if(count == 0 && callback){
                    callback();
                }
            });
        }
        callback = () => {
            for(let userId in entry.voted){
                let user = users[userId];
                msg += `\n${parseUsername(user)}: ${entry.answers[entry.voted[userId]]}`;
            }
            msg += '\n\nTotal votes:';
            for(let i = 0; i < entry.answers.length; i++){
                let answer = entry.answers[i];
                msg += `\n${answer}: ${obj[i] || 0}`
            }
            context.editMessage(msg, { keyboard: this.constructKeyboardForEntry(entry.answers) });
        }
        if(count == 0){
            callback();
        }
    }
    constructKeyboardForEntry(answers: string[]): TelegramInlineKeyboardButton[][] {
        return formatButtons(...answers.map(c => button(c, 'poll', 'answer', c)))
    }
    private onPollQuestionReceived(context: TelegramMessageContext, output: TelegramOutput) {
        let entry = this.entries[context.message.from.id];
        if (!entry)
            return output.sendToChat('Something went wrong. Try again.');
        entry.question = context.message.text;
        output.sendToChat(`Okay, the question is:\n**${entry.question}**.\nDo you want to send this to ${entry.ChatName}?`, {
            parse_mode: 'Markdown',
            keyboard: [
                [button('Yes', 'poll', 'confirm', 'yes'), button('No', 'poll', 'confirm', 'no')]
            ]
        });
    }
} 