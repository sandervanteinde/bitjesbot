import { TelegramMessage } from "../../typings/telegram";

export class TelegramMessageContext {
    get GroupChat(): boolean {
        return !this.PrivateChat;
    }
    get PrivateChat(): boolean {
        return this.message.chat.type == 'private';
    }
    constructor(
        public message: TelegramMessage,
        public slashCommand: string,
        public args: string[]
    ) { }
}