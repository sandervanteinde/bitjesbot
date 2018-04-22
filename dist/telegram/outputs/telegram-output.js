"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelegramOutput {
    constructor(bot) {
        this.bot = bot;
    }
    sendToChat(message, { reply, forceReply, parse_mode, callback, keyboard } = { reply: false }) {
        let options = {
            text: message,
            chat_id: this.getChatId(),
            parse_mode
        };
        if (reply)
            options.reply_to_message_id = this.getMessageId();
        if (keyboard && forceReply)
            throw 'You can\'t do a force reply and send a keyboard at the same time!';
        if (keyboard)
            options.reply_markup = { inline_keyboard: keyboard };
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
    editMessage(message, { keyboard, parse_mode } = {}) {
        let options = {
            chat_id: this.getChatId(),
            message_id: this.getMessageId(),
            text: message,
            parse_mode
        };
        if (keyboard)
            options.reply_markup = { inline_keyboard: keyboard };
        this.bot.callApiMethod('editMessageText', options);
    }
    sendLocation({ lat, lng }, { reply } = { reply: false }) {
        let options = {
            chat_id: this.getChatId(),
            latitude: lat,
            longitude: lng
        };
        if (reply)
            options.reply_to_message_id = this.getMessageId();
        this.bot.callApiMethod('sendLocation', options);
    }
}
exports.TelegramOutput = TelegramOutput;
//# sourceMappingURL=telegram-output.js.map