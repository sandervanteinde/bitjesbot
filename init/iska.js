const bot = require('./bot');
const db = require('../utils/db');
const server = require('../utils/server');
class Iska{
    constructor(){
        bot.registerSlashCommand('iska', 'Enables ISKA twitter notifications', (msg) => this.onIskaMessage(msg));
        db.getCollection('iska', coll => this.db = coll);
        server.registerRoute('/36d6abd6-73a2-4c92-bcda-815ffb422ea3', (req) => {
            bodyparser.parseJson(req.request, body => {
                console.log(body);
                req.success();
            });
        });
    }
    /**
     * @param {TelegramMessage} msg 
     */
    onIskaMessage(msg){
        let exists = this.db.items.filter(c => msg.chat.id).length == 1;
        if(exists){
            this.db.delete(msg.chat.id);
        }else{
            this.db.add(msg.chat.id)
        };
        bot.sendMessage({
            chatId: msg.chat.id,
            message: exists ? 'Removed you from the ISKA list.' : 'Added you to the ISKA list.',
            replyId: msg.message_id
        });
    }
}

module.exports = new Iska();