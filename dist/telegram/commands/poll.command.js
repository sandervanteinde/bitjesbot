"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../utils/config");
const keyboard_1 = require("../keyboard/keyboard");
const chat_id_output_1 = require("../outputs/chat-id-output");
const db_1 = require("../../utils/db");
const message_id_output_1 = require("../outputs/message-id-output");
const utils_1 = require("../../utils/utils");
class PollEntry {
    constructor(chatId, chatName) {
        this.chatId = chatId;
        this.chatName = chatName;
        this.question = '';
        this.answers = ['Yes', 'No'];
    }
    get ChatName() { return this.chatName; }
    get ChatId() { return this.chatId; }
}
class PollDatabaseEntry {
    constructor(messageId, chatId, question, answers) {
        this.messageId = messageId;
        this.chatId = chatId;
        this.question = question;
        this.answers = answers;
        this.voted = {};
    }
}
class PollCommand {
    constructor(bot) {
        this.bot = bot;
        this.entries = {};
        this.db = new db_1.Database('polls');
        this.db.load();
    }
    getCallbackNames() {
        return 'poll';
    }
    getSlashCommands() {
        return 'poll';
    }
    getHelpMessageText() {
        return 'Starts a simple yes/no poll';
    }
    isGroupOnly() {
        return true;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        output.sendToFrom('What is the question of the poll?', {
            callback: (msg) => {
                output.sendToChat('A message was sent privately to set up the poll.', { reply: true });
                this.entries[context.message.from.id] = new PollEntry(context.message.chat.id, context.message.chat.title);
            },
            error: (err) => {
                output.sendToChat(err.error_code == 403 ? `I can't send you a private message. Start the bot first at @${config_1.default.botName}` : 'Something went wrong. Contact the admin of this bot!', { reply: true });
            },
            forceReply: (c, o) => this.onPollQuestionReceived(c, o)
        });
    }
    onQuery(query, output) {
        let [command] = query.args;
        switch (command) {
            case 'confirm':
                let entry = this.entries[query.query.from.id];
                if (!entry) {
                    return output.editMessage('Something went wrong.');
                }
                let [, yesOrNo] = query.args;
                if (yesOrNo == 'yes') {
                    let chatOutput = new chat_id_output_1.ChatIdOutput(this.bot, entry.ChatId);
                    chatOutput.sendToChat(`A new poll was created:\n${entry.question}`, {
                        callback: msg => {
                            let dbEntry = new PollDatabaseEntry(msg.message_id, entry.ChatId, entry.question, entry.answers);
                            this.db.add(dbEntry);
                            this.db.saveChanges();
                        },
                        keyboard: this.constructKeyboardForEntry(entry.answers)
                    });
                    output.editMessage(`Your poll was sent to: ${entry.ChatName}`);
                }
                else {
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
                }
                else {
                    dbEntry.voted[from] = index;
                    this.modifyMessageToReflectVotes(dbEntry);
                    return `You voted ${dbEntry.answers[index]}`;
                }
        }
    }
    modifyMessageToReflectVotes(entry) {
        this.db.saveChanges();
        let context = new message_id_output_1.MessageIdOutput(this.bot, entry.messageId, entry.chatId);
        let msg = `Poll: ${entry.question}\n\nVotes:`;
        let obj = [];
        let users = {};
        let count = 0;
        let callback;
        for (let userId in entry.voted) {
            if (!obj[entry.voted[userId]])
                obj[entry.voted[userId]] = 0;
            obj[entry.voted[userId]]++;
            count++;
            this.bot.getUserInGroup(entry.chatId, Number(userId), (user) => {
                if (user)
                    users[userId] = user;
                count--;
                if (count == 0 && callback) {
                    callback();
                }
            });
        }
        callback = () => {
            for (let userId in entry.voted) {
                let user = users[userId];
                msg += `\n${utils_1.parseUsername(user)}: ${entry.answers[entry.voted[userId]]}`;
            }
            msg += '\n\nTotal votes:';
            for (let i = 0; i < entry.answers.length; i++) {
                let answer = entry.answers[i];
                msg += `\n${answer}: ${obj[i] || 0}`;
            }
            context.editMessage(msg, { keyboard: this.constructKeyboardForEntry(entry.answers) });
        };
        if (count == 0) {
            callback();
        }
    }
    constructKeyboardForEntry(answers) {
        return keyboard_1.formatButtons(...answers.map(c => keyboard_1.button(c, 'poll', 'answer', c)));
    }
    onPollQuestionReceived(context, output) {
        let entry = this.entries[context.message.from.id];
        if (!entry)
            return output.sendToChat('Something went wrong. Try again.');
        entry.question = context.message.text;
        output.sendToChat(`Okay, the question is:\n**${entry.question}**.\nDo you want to send this to ${entry.ChatName}?`, {
            parse_mode: 'Markdown',
            keyboard: [
                [keyboard_1.button('Yes', 'poll', 'confirm', 'yes'), keyboard_1.button('No', 'poll', 'confirm', 'no')]
            ]
        });
    }
}
exports.PollCommand = PollCommand;
//# sourceMappingURL=poll.command.js.map