import { TelegramBot } from "../telegram-bot";
import { TelegramOutput } from "./telegram-output";

export class ChatIdOutput extends TelegramOutput {
    constructor(bot : TelegramBot, private chatId: number){
        super(bot);
    }
    getChatId(): number {
        return this.chatId;
    }
    getMessageId(): number {
        throw 'ChatIdOutput does not support the fetching of message ids!';
    }
}