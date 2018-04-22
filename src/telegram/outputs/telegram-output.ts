import { TelegramEditMessageText, TelegramInlineKeyboardButton, TelegramMessage, TelegramSendLocation, TelegramSendMessage } from "../../../typings/telegram";
import { TelegramBot } from "../telegram-bot";
import { TelegramMessageContext } from "../telegram-message-context";
type ReplyToChatOptions = {
    reply?: boolean;
    forceReply?: ForceReplyFunction;
    parse_mode?: 'Markdown' | 'HTML';
    callback?: SendMessageReplyCallback;
    keyboard?: TelegramInlineKeyboardButton[][];
};
type EditMessageOptions = {
    keyboard?: TelegramInlineKeyboardButton[][]
    parse_mode?: 'Markdown' | 'HTML';
};
type SendLocationOptions = {
    reply: boolean;
};
type SendMessageReplyCallback = (msg: TelegramMessage) => void;
export type ForceReplyFunction = (context: TelegramMessageContext, output: TelegramOutput) => void;
export abstract class TelegramOutput {
    constructor(
        private bot: TelegramBot
    ) { }
    abstract getChatId(): number;
    abstract getMessageId(): number;

    sendToChat(message: string, { reply, forceReply, parse_mode, callback, keyboard }: ReplyToChatOptions = { reply: false }) {
        let options: TelegramSendMessage = {
            text: message,
            chat_id: this.getChatId(),
            parse_mode
        };
        if (reply)
            options.reply_to_message_id = this.getMessageId();
        if (keyboard && forceReply)
            throw 'You can\'t do a force reply and send a keyboard at the same time!';
        if (keyboard)
            options.reply_markup = { inline_keyboard: keyboard };
        if (forceReply) {
            options.reply_markup = { force_reply: true, selective: true };
            let oldCallback = callback;
            callback = (msg) => {
                this.bot.registerReplyHandler(msg.message_id, msg.chat.id, forceReply);
                if (oldCallback)
                    oldCallback(msg);
            }
        }
        this.bot.callApiMethod<TelegramMessage>('sendMessage', options, (resp) => { if (callback) callback(resp.result); });
    }
    editMessage(message: string, { keyboard, parse_mode }: EditMessageOptions = {}) {
        let options: TelegramEditMessageText = {
            chat_id: this.getChatId(),
            message_id: this.getMessageId(),
            text: message,
            parse_mode
        };
        if (keyboard)
            options.reply_markup = { inline_keyboard: keyboard };
        this.bot.callApiMethod<TelegramMessage>('editMessageText', options);
    }
    sendLocation({lat,lng}: {lat: number, lng: number}, {reply} : SendLocationOptions = {reply: false}): any {
        let options : TelegramSendLocation= {
            chat_id: this.getChatId(),
            latitude: lat,
            longitude: lng
        };
        if(reply)
            options.reply_to_message_id = this.getMessageId();
        this.bot.callApiMethod<TelegramMessage>('sendLocation', options);
    }
}