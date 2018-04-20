const bot = require('./bot');
const http = require('http');
const bodyparser = require('../utils/bodyparser');

class PickupLine{
    constructor(){
        bot.registerSlashCommand('pickupline', 'Retrieves a random pickup line.', (...args) => this.onSlashCommand(...args));
    }
    /**
     * 
     * @param {TelegramMessage} message 
     * @param {string} slashCmd
     * @param {string} param
     */
    onSlashCommand(message){
        http.get('http://pebble-pickup.herokuapp.com/tweets/random', (res)=> bodyparser.parseJson(res, content => {
            /** 
             * @type {string}
             */
            let msg = content.tweet;
            msg = msg.replace('[Your Name]', message.from.first_name);
            bot.sendMessage({chatId: message.chat.id, message: msg, replyId: message.message_id});
        }));
    }
}
module.exports = new PickupLine();