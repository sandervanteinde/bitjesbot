"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelegramMessageOutput {
    constructor(bot, message) {
        this.bot = bot;
        this.message = message;
    }
    sendToChat(message, { reply } = { reply: false }) {
        let options = {
            text: message,
            chat_id: this.message.chat.id
        };
        if (reply)
            options.reply_to_message_id = this.message.message_id;
        this.bot.callApiMethod('sendMessage', options);
    }
}
exports.TelegramMessageOutput = TelegramMessageOutput;
//# sourceMappingURL=telegram-message-output.js.map