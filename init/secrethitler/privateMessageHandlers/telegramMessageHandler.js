const bot = require('../../bot');
const PrivateMessageHandler = require('./privateMessageHandler');
const PrivateMessage = require('../privateMessage');
class TelegramMessageHandler extends PrivateMessageHandler{
    /**
     * @param {number} playerId 
     */
    constructor(playerId){
        super();
        this.playerId = playerId;
    }
    /**
     * 
     * @param {PrivateMessage} message 
     */
    sendMessage(message){
        bot.sendMessage({
            chatId: this.playerId,
            message: message.message,
            callback:message.callback,
            keyboard: message.keyboard,
            error: message.error
        });
    }
    /**
     * @param {number} msgId
     * @param {PrivateMessage} message 
     */
    editMessage(msgId, message){
        bot.editMessage(this.playerId, msgId, message.message, {keyboard: message.keyboard});
    }
}
module.exports = TelegramMessageHandler;