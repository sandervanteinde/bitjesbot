"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelegramUserCache {
    constructor(bot) {
        this.bot = bot;
        this.cache = {};
    }
    getUser(chatId, userId, callback) {
        if (this.cache[chatId] && this.cache[chatId][userId])
            callback(this.cache[chatId][userId]);
        else {
            this.bot.callApiMethod('getChatMember', {
                chat_id: chatId,
                user_id: userId
            }, (resp) => {
                if (resp.ok) {
                    this.addUserToCache(chatId, userId, resp.result.user);
                    callback(resp.result.user);
                }
                else {
                    callback();
                }
            });
        }
    }
    addUserToCache(chatId, userId, user) {
        this.cache[chatId] = this.cache[chatId] || {};
        if (!this.cache[chatId][userId])
            setTimeout(() => delete this.cache[chatId][userId], 1000 * 60 * 60);
        this.cache[chatId][userId] = user;
    }
}
exports.TelegramUserCache = TelegramUserCache;
//# sourceMappingURL=telegram-user-cache.js.map