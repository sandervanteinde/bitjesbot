"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelegramMessageContext {
    constructor(message, slashCommand, args) {
        this.message = message;
        this.slashCommand = slashCommand;
        this.args = args;
    }
    get GroupChat() {
        return !this.PrivateChat;
    }
    get PrivateChat() {
        return this.message.chat.type == 'private';
    }
}
exports.TelegramMessageContext = TelegramMessageContext;
//# sourceMappingURL=telegram-message-context.js.map