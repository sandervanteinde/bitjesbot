import { TelegramMessage } from "../../../typings/telegram";
import { TelegramBot } from "../telegram-bot";
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