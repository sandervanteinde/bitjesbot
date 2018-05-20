"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_output_1 = require("./telegram-output");
class ChatIdOutput extends telegram_output_1.TelegramOutput {
    constructor(bot, chatId) {
        super(bot);
        this.chatId = chatId;
    }
    getChatId() {
        return this.chatId;
    }
    getMessageId() {
        throw 'ChatIdOutput does not support the fetching of message ids!';
    }
    getFromId() {
        throw 'ChatIdOutput does not support the fetching of from ids!';
    }
}
exports.ChatIdOutput = ChatIdOutput;
//# sourceMappingURL=chat-id-output.js.map