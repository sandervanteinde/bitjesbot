"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const moment = require("moment");
const bodyparser_1 = require("../utils/bodyparser");
const config_1 = require("../utils/config");
const loop_1 = require("../utils/loop");
const keyboard_handler_1 = require("./keyboard/keyboard-handler");
const telegram_message_output_1 = require("./outputs/telegram-message-output");
const telegram_message_context_1 = require("./telegram-message-context");
class TelegramBot {
    constructor() {
        this.slashCommands = {};
        this.polling = false;
        this.lastMessage = 0;
        this.url = `bot${config_1.default.API_KEY}`;
        this.replyHandlers = {};
        this.keyboardHandler = new keyboard_handler_1.KeyboardHandler(this);
        this.subscribeReplyHandlerDeletion();
    }
    subscribeReplyHandlerDeletion(timeInMinutes = 60) {
        loop_1.default.subscribe(() => {
            let now = moment();
            for (let key in this.replyHandlers) {
                let entry = this.replyHandlers[key];
                let duration = moment.duration(now.diff(entry.time));
                let minutes = duration.asMinutes();
                if (minutes >= timeInMinutes) {
                    this.callApiMethod('editMessageText', {
                        chat_id: entry.chat,
                        message_id: key,
                        text: 'This message has expired'
                    });
                    delete this.replyHandlers[key];
                }
            }
        });
    }
    registerSlashCommand(command, helpMessage, callback, { groupOnly, privateOnly } = { groupOnly: false, privateOnly: false }) {
        if (this.slashCommands[command])
            throw `A command with the name ${command} already exists!`;
        let obj = { help: helpMessage, callback, groupOnly, privateOnly };
        this.slashCommands[command] = obj;
    }
    isKeyboardHandler(command) {
        return command.onQuery !== undefined && command.getCallbackNames !== undefined;
    }
    registerBotCommand(command) {
        let slashCommands = command.getSlashCommands();
        let help = command.getHelpMessageText();
        let options = {
            groupOnly: command.isGroupOnly(),
            privateOnly: command.isPrivateOnly()
        };
        let callback = (context, output) => command.onMessage(context, output);
        if (slashCommands instanceof Array) {
            if (help && help instanceof Array) {
                let asArray = help;
                slashCommands.forEach((s, i) => this.registerSlashCommand(s, asArray[i], callback, options));
            }
            else {
                let asNotArray = help;
                slashCommands.forEach((s, i) => this.registerSlashCommand(s, asNotArray, callback, options));
            }
        }
        else {
            if (help && help instanceof Array)
                [help] = help;
            this.registerSlashCommand(slashCommands, help, callback, options);
        }
        if (this.isKeyboardHandler(command)) {
            this.keyboardHandler.registerHandler(command);
        }
    }
    callApiMethod(method, body, callback, error) {
        let postOptions = {
            host: 'api.telegram.org',
            path: `/${this.url}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };
        let req = https_1.request(postOptions, (res) => bodyparser_1.default.parseJson(res, responseBody => {
            if (!responseBody.ok) {
                if (error)
                    error(responseBody);
                else
                    console.error('Unhandled wrongly parsed message!', responseBody);
            }
            else if (callback)
                callback(responseBody);
        }));
        if (error)
            req.on('error', error);
        else
            req.on('error', (err) => {
                this.polling = false;
                if (err.code == 'ETIMEDOUT' && method == 'getUpdates')
                    return; //not important, this happens when polling
                console.error({
                    method,
                    message: 'Unhandled API error!',
                    inner: err,
                });
            });
        if (body)
            req.write(JSON.stringify(body));
        req.end();
    }
    registerReplyHandler(messageId, chatId, callback) {
        this.replyHandlers[messageId] = { chat: chatId, handler: callback, time: moment() };
    }
    setWebhook(domain, server) {
        let route = `/${config_1.default.API_KEY}`;
        server.registerRoute(route, (req) => {
            req.asObject(obj => {
                this.onMessageReceived(obj);
            });
            req.success();
        });
        let url = `https://${domain}${route}`;
        this.callApiMethod('setWebhook', { url });
    }
    deleteWebhook() {
        this.callApiMethod('deleteWebhook');
    }
    pollMessages() {
        if (this.polling)
            return;
        this.polling = true;
        this.callApiMethod('getUpdates', { offset: this.lastMessage + 1 }, body => {
            if (!body.ok)
                return;
            body.result.forEach(msg => this.onMessageReceived(msg));
            this.polling = false;
        });
    }
    onMessageReceived(update) {
        try {
            if (update.message)
                this.processMessage(update.message);
            else if (update.callback_query)
                this.keyboardHandler.handleCallback(update.callback_query);
        }
        catch (_a) {
        }
        finally {
            this.lastMessage = update.update_id;
        }
    }
    processMessage(message) {
        if (message.text)
            this.processTextMessage(message);
    }
    processTextMessage(message) {
        if (message.reply_to_message && this.handleReply(message))
            return;
        if (message.text[0] == '/') {
            return this.interpretSlashCommand(message);
        }
    }
    handleReply(message) {
        let entry = this.replyHandlers[message.reply_to_message.message_id];
        if (entry) {
            entry.handler(new telegram_message_context_1.TelegramMessageContext(message, null, []), new telegram_message_output_1.TelegramMessageOutput(this, message));
            delete this.replyHandlers[message.reply_to_message.message_id];
            return true;
        }
        return false;
    }
    interpretSlashCommand(message) {
        let [command, ...args] = message.text.split(' ');
        command = command.substring(1).toLowerCase();
        let obj = this.slashCommands[command];
        let context = new telegram_message_context_1.TelegramMessageContext(message, command, args);
        let output = new telegram_message_output_1.TelegramMessageOutput(this, message);
        if (obj) {
            let { callback, privateOnly, groupOnly } = obj;
            if (groupOnly && context.PrivateChat)
                output.sendToChat('This command is only available in group chats');
            else if (privateOnly && context.GroupChat)
                output.sendToChat('This command is only available in private chats');
            else
                callback(context, output);
        }
        else {
            output.sendToChat('Unknown command. Type /help for commands!');
        }
    }
    setupDefaultCallbacks() {
        this.registerSlashCommand('help', null, (context, output) => {
            let commands = [];
            for (let slashCommand in this.slashCommands) {
                if (slashCommand.indexOf('@') >= 0)
                    continue;
                let { help, groupOnly, privateOnly } = this.slashCommands[slashCommand];
                if (groupOnly && context.PrivateChat)
                    continue;
                if (privateOnly && context.GroupChat)
                    continue;
                if (help)
                    commands.push(`/${slashCommand} - ${help}`);
            }
            output.sendToChat(`Available commands:\n\n${commands.join('\n')}`);
        });
        this.registerSlashCommand('about', 'About this bot', (msg, output) => {
            output.sendToChat('This bot is made by Sander van \'t Einde.\nYou can view the source at https://www.github.com/sandervanteinde/bitjesbot');
        });
    }
    start(server) {
        if (server) { //start as webhooks
            if (!config_1.default.domain)
                throw 'A domain must be registered to start the bot with Webhooks';
            if (!server.runningSecure)
                throw 'The web server must be running secure before you can start the telegram bot in webhook mode!';
            this.setWebhook(config_1.default.domain, server);
        }
        else {
            this.deleteWebhook();
            loop_1.default.subscribe(() => this.pollMessages());
        }
        this.setupDefaultCallbacks();
    }
}
exports.TelegramBot = TelegramBot;
//# sourceMappingURL=telegram-bot.js.map