"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../utils/config");
const keyboard_1 = require("../keyboard/keyboard");
const chat_id_output_1 = require("../outputs/chat-id-output");
const db_1 = require("../../utils/db");
const message_id_output_1 = require("../outputs/message-id-output");
class PollEntry {
    constructor(chatId, chatName) {
        this.chatId = chatId;
        this.chatName = chatName;
        this.question = '';
        this.answers = [];
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
            case 'send':
                return this.onConfirm(query, output);
            case 'edit':
                return this.onEdit(query, output);
            case 'add':
                return this.onAdd(query, output);
            case 'remove':
                return this.onRemove(query, output);
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
        let msg = `Poll: ${entry.question}\nVotes:`;
        let obj = [];
        for (let userId in entry.voted) {
            if (!obj[entry.voted[userId]])
                obj[entry.voted[userId]] = 0;
            obj[entry.voted[userId]]++;
        }
        for (let i = 0; i < entry.answers.length; i++) {
            let answer = entry.answers[i];
            msg += `\n${answer}: ${obj[i] || 0}`;
        }
        context.editMessage(msg, { keyboard: this.constructKeyboardForEntry(entry.answers) });
    }
    constructKeyboardForEntry(answers) {
        return keyboard_1.formatButtons(...answers.map(c => keyboard_1.button(c, 'poll', 'answer', c)));
    }
    parseMessageForEntry(entry) {
        let { question, ChatName, answers } = entry;
        let msg = `Okay, the question is:\n**${question}**.\nAnswers:`;
        for (let answer of answers) {
            msg += `\n- ${answer}`;
        }
        msg += `\nWhat do you want to do?`;
        return msg;
    }
    getDefaultKeyboardForEntry(entry) {
        let sendToChatBtn = keyboard_1.button('Send to chat', 'poll', 'send');
        let editQuestion = keyboard_1.button('Edit question', 'poll', 'edit');
        let addAnswer = keyboard_1.button('Add question', 'poll', 'add');
        let removeAnswer = keyboard_1.button('Remove question', 'poll', 'remove');
        if (entry.answers.length > 1) {
            return [
                [addAnswer, removeAnswer],
                [editQuestion, sendToChatBtn]
            ];
        }
        else {
            return [
                [addAnswer],
                [editQuestion]
            ];
        }
    }
    onPollQuestionReceived(context, output) {
        let entry = this.entries[context.message.from.id];
        if (!entry)
            return output.sendToChat('Something went wrong. Try again.');
        entry.question = context.message.text;
        output.sendToChat(this.parseMessageForEntry(entry), {
            parse_mode: 'Markdown',
            keyboard: this.getDefaultKeyboardForEntry(entry)
        });
    }
    onEdit(query, output) {
    }
    onAdd(query, output) {
        let entry = this.entries[query.query.from.id];
        output.editMessage('Adding answer.');
        output.sendToChat('Please send the new answer, as a reply to this message.', {
            forceReply: (msg) => {
                entry.answers.push(msg.message.text);
                output.sendToChat(this.parseMessageForEntry(entry), {
                    keyboard: this.getDefaultKeyboardForEntry(entry)
                });
            }
        });
    }
    onRemove(query, output) {
    }
    onConfirm(query, output) {
        let entry = this.entries[query.query.from.id];
        if (!entry) {
            return output.editMessage('Something went wrong.');
        }
        let [, yesOrNo] = query.args;
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
        delete this.entries[query.query.from.id];
    }
}
exports.PollCommand = PollCommand;
//# sourceMappingURL=poll.command.js.map