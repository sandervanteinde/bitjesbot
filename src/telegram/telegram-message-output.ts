import { TelegramBot } from "./telegram-bot";
import { TelegramMessage, TelegramSendMessage } from "../../typings/telegram";
type ReplyToChatOptions = {
    reply: boolean;
}
export class TelegramMessageOutput {
    constructor(
        private bot: TelegramBot,
        private message: TelegramMessage
    ) { }
    sendToChat(message: string, { reply }: ReplyToChatOptions = {reply: false}) {
        let options : TelegramSendMessage = { 
            text: message, 
            chat_id: this.message.chat.id 
        };
        if(reply)
            options.reply_to_message_id = this.message.message_id;
        this.bot.callApiMethod('sendMessage', options);
    }
}