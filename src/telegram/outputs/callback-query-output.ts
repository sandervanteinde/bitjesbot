import { TelegramCallbackQuery } from "../../../typings/telegram";
import { TelegramBot } from "../telegram-bot";
import { TelegramOutput } from "./telegram-output";

export class CallbackQueryOutput extends TelegramOutput {
    constructor(bot : TelegramBot, private query : TelegramCallbackQuery){
        super(bot);
    }
    getChatId(): number {
        return this.query.message.chat.id;
    }
    getMessageId(): number {
        return this.query.message.message_id;
    }
}