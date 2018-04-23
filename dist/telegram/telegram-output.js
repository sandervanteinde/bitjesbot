"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelegramOutput {
    constructor(bot) {
        this.bot = bot;
    }
    sendToChat(message, { reply, forceReply, parse_mode, callback } = { reply: false }) {
        let options = {
            text: message,
            chat_id: this.getChatId(),
            parse_mode
        };
        if (reply)
            options.reply_to_message_id = this.getMessageId();
        if (forceReply) {
            options.reply_markup = { force_reply: true, selective: true };
            let oldCallback = callback;
            callback = (msg) => {
                this.bot.registerReplyHandler(msg.message_id, msg.chat.id, forceReply);
                if (oldCallback)
                    oldCallback(msg);
            };
        }
        this.bot.callApiMethod('sendMessage', options, (resp) => { if (callback)
            callback(resp.result); });
    }
}
exports.TelegramOutput = TelegramOutput;
//# sourceMappingURL=telegram-output.js.map