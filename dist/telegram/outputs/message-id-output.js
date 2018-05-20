"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_output_1 = require("./telegram-output");
class MessageIdOutput extends telegram_output_1.TelegramOutput {
    constructor(bot, messageId, chatId) {
        super(bot);
        this.messageId = messageId;
        this.chatId = chatId;
    }
    getChatId() {
        return this.chatId;
    }
    getMessageId() {
        return this.messageId;
    }
    getFromId() {
        throw 'MessageIdOutput does not support the fetching of the from id';
    }
}
exports.MessageIdOutput = MessageIdOutput;
//# sourceMappingURL=message-id-output.js.map