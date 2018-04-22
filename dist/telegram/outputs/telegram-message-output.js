"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_output_1 = require("./telegram-output");
class TelegramMessageOutput extends telegram_output_1.TelegramOutput {
    constructor(bot, message) {
        super(bot);
        this.message = message;
    }
    getChatId() {
        return this.message.chat.id;
    }
    getMessageId() {
        return this.message.message_id;
    }
}
exports.TelegramMessageOutput = TelegramMessageOutput;
//# sourceMappingURL=telegram-message-output.js.map