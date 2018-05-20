import { TelegramOutput } from "./telegram-output";
import { TelegramBot } from "../telegram-bot";

export class MessageIdOutput extends TelegramOutput {
    constructor(
        bot: TelegramBot,
        private messageId: number,
        private chatId: number) {
        super(bot);
    }
    getChatId(): number {
        return this.chatId;
    }
    getMessageId(): number {
        return this.messageId;
    }
    getFromId(): number {
        throw 'MessageIdOutput does not support the fetching of the from id';
    }
}