import { TelegramUser } from "../../typings/telegram";
import { TelegramBot } from "./telegram-bot";

export class TelegramUserCache {
    private cache: { [chatId: string]: { [userId: number]: TelegramUser } } = {};
    constructor(private bot: TelegramBot) {

    }
    getUser(chatId: number | string, userId: | number, callback: (user?: TelegramUser) => void) {
        if (this.cache[chatId] && this.cache[chatId][userId])
            callback(this.cache[chatId][userId]);
        else {
            this.bot.callApiMethod<{user: TelegramUser}>('getChatMember', {
                chat_id: chatId,
                user_id: userId
            }, (resp) => {
                if (resp.ok) {
                    this.addUserToCache(chatId, userId, resp.result.user);
                    callback(resp.result.user);
                } else {
                    callback();
                }
            });
        }
    }
    addUserToCache(chatId: number | string, userId : number, user : TelegramUser){
        this.cache[chatId] = this.cache[chatId] || {};
        if(!this.cache[chatId][userId])
            setTimeout(() => delete this.cache[chatId][userId], 1000 * 60 * 60);
        this.cache[chatId][userId] = user;
    }
}