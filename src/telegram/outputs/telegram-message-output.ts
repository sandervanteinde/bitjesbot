import { TelegramBot } from "../telegram-bot";
import { TelegramMessage, TelegramSendMessage } from "../../../typings/telegram";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramOutput } from "./telegram-output";

export class TelegramMessageOutput extends TelegramOutput {
    constructor(bot : TelegramBot, private message : TelegramMessage) {
        super(bot);
    }
    getChatId(): number {
        return this.message.chat.id;
    }
    getMessageId(): number {
        return this.message.message_id;
    }
}