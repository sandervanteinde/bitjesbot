"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_output_1 = require("./telegram-output");
class CallbackQueryOutput extends telegram_output_1.TelegramOutput {
    constructor(bot, query) {
        super(bot);
        this.query = query;
    }
    getChatId() {
        return this.query.message.chat.id;
    }
    getMessageId() {
        return this.query.message.message_id;
    }
    getFromId() {
        return this.query.from.id;
    }
}
exports.CallbackQueryOutput = CallbackQueryOutput;
//# sourceMappingURL=callback-query-output.js.map