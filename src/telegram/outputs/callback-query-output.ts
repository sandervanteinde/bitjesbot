import { TelegramOutput } from "./telegram-output";
import { TelegramBot } from "../telegram-bot";
import { TelegramCallbackQuery } from "../../../typings/telegram";

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