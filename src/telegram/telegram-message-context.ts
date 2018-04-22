import { TelegramMessage } from "../../typings/telegram";

export class TelegramMessageContext {
    get hasArguments() :boolean{
        return this.args != null && this.args.length > 0;
    }
    get GroupChat(): boolean {
        return !this.PrivateChat;
    }
    get PrivateChat(): boolean {
        return this.message.chat.type == 'private';
    }
    constructor(
        public message: TelegramMessage,
        public slashCommand: string | null,
        public args: string[]
    ) { }
}