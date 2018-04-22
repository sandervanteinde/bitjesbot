import { TelegramBot } from "../telegram-bot";
import { TelegramSendMessage, TelegramMessage, TelegramInlineKeyboardButton, TelegramEditMessageText } from "../../../typings/telegram";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramMessageOutput } from "./telegram-message-output";
type ReplyToChatOptions = {
    reply: boolean;
    forceReply?: ForceReplyFunction;
    parse_mode?: 'Markdown' | 'HTML';
    callback?: SendMessageReplyCallback;
    keyboard?: TelegramInlineKeyboardButton[][];
}
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
    editMessage(message: string, { keyboard }: { keyboard?: TelegramInlineKeyboardButton[][] } = {}) {
        let options: TelegramEditMessageText = {
            chat_id: this.getChatId(),
            message_id: this.getMessageId(),
            text: message
        };
        if (keyboard)
            options.reply_markup = { inline_keyboard: keyboard };
        this.bot.callApiMethod<TelegramMessage>('editMessageText', options);
    }
}