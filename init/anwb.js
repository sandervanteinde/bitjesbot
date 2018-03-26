const bot = require('./bot');
const https = require('https');
const bodyparser = require('../utils/bodyparser');
let cache = undefined;
class PickupLine{
    constructor(){
        bot.registerSlashCommand('anwb', 'Retrieves a random pickup line.', (...args) => this.onAnwb(...args));
    }
    /**
     * 
     * @param {TelegramMessage} message 
     * @param {string} slashCmd
     * @param {string[]} param
     */
    onAnwb(message, slashCmd, ...param){
        if(param.length == 0){
            return bot.sendMessage({
                chatId: message.chat.id,
                message: 'Welke weg wil je de files van weten?',
                replyId: message.message_id,
                forceReplyHandler: (message) => this.sendAnwbReply(message, message.text),
            });
        }
        this.sendAnwbReply(message, param.join(' '));
    }
    /**
     * @param {TelegramMessage} message
     * @param {string} road 
     */
    sendAnwbReply(message, road){
        road = road.toUpperCase();
        this.doApiCall(entries => {
           let filtered = entries.filter(e => e.road == road); 
           if(filtered.length == 0 || filtered[0].events.trafficJams.length == 0){
               bot.sendMessage({
                   replyId: message.message_id,
                   chatId: message.chat.id,
                   message: `Er zijn geen files op de ${road}`,
                });
           }else{
               let jams = filtered[0].events.trafficJams;
               let msg = `Er ${jams.length == 1 ? 'is' : 'zijn'} *${jams.length}* file${jams.length > 1 ? 's' : ''} gemeld op de ${road}`;
               for(let i = 0; i < jams.length; i++){
                   let jam = jams[i];
                   msg += `\n\n- Van *${jam.from}* naar *${jam.to}* (*${Math.round(jam.distance / 1000)} KM* / *${Math.round(jam.delay / 60)} min.* vertraging)\n${jam.description}`;
               }
               bot.sendMessage({
                   replyId: message.message_id,
                   chatId: message.chat.id,
                   message: msg,
                   parse_mode: 'Markdown',
               });
           }
        });
    }
    /**
     * 
     * @param {function(AnwbRoadEntry[]):void} callback 
     */
    doApiCall(callback){
        if(cache == null){
            https.get('https://www.anwb.nl/feeds/gethf', res => bodyparser.parseJson(res, (body) => {
                cache = body;
                callback(body.roadEntries);
                setTimeout(() => cache = null, 60000);
            }));
        }
        else
            callback(cache.roadEntries);
    }
}

module.exports = new PickupLine();