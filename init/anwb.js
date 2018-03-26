const bot = require('./bot');
const https = require('https');
const bodyparser = require('../utils/bodyparser');
const roadRegex = /([AN]\d+)/gi
let cache = undefined;
class PickupLine {
    constructor() {
        bot.registerSlashCommand('anwb', 'Dutch traffic information services', (...args) => this.onAnwb(...args));
    }
    /**
     * 
     * @param {TelegramMessage} message 
     * @param {string} slashCmd
     * @param {string[]} param
     */
    onAnwb(message, slashCmd, ...param) {
        if (param.length == 0) {
            return bot.sendMessage({
                chatId: message.chat.id,
                message: 'Welke weg wil je de files van weten?',
                replyId: message.message_id,
                forceReplyHandler: (message) => this.sendAnwbReply(message, message.text.split(' ')),
            });
        }
        this.sendAnwbReply(message, param);
    }
    /**
     * @param {TelegramMessage} message
     * @param {string[]} roads
     */
    sendAnwbReply(message, roads) {
        /**
         * @type {string[]}
         */
        let matches = [];
        for (let road of roads) {
            let match = road.match(roadRegex);
            if (match){
                let [matchedRoad] = match;
                matchedRoad = matchedRoad.toUpperCase();
                if(matches.indexOf(matchedRoad) == -1)
                    matches.push(matchedRoad);
            } 
        }
        if (matches.length == 0) {
            return bot.sendMessage({
                replyId: message.message_id,
                chatId: message.chat.id,
                message: 'Er is geen valide weg opgegeven.\nValide wegen zijn A of N wegen, gevolgd door het nummer.'
            });
        }else if(matches.length > 5){
            return bot.sendMessage({
                replyId: message.message_id,
                chatId: message.chat.id,
                message: 'Het maximum aantal wegen dat je kan selecteren is 5.'
            });
        }
        this.doApiCall(entries => {
            let msg = '';
            for (let road of matches) {
                let entry = entries[road];
                if (!entry || entry.events.trafficJams.length == 0) {
                    msg += `Er zijn geen files op de ${road}\n\n`;
                } else {
                    let jams = entry.events.trafficJams;
                    msg += `Er ${jams.length == 1 ? 'is' : 'zijn'} *${jams.length}* file${jams.length > 1 ? 's' : ''} gemeld op de ${road}`;
                    for (let i = 0; i < jams.length; i++) {
                        let jam = jams[i];
                        msg += `\n\n- Van *${jam.from}* naar *${jam.to}* (*${Math.round(jam.distance / 1000)} KM* / *${Math.round(jam.delay / 60)} min.* vertraging)\n${jam.description}`;
                    }
                    msg += '\n\n';
                }
            }
            bot.sendMessage({
                replyId: message.message_id,
                chatId: message.chat.id,
                message: msg,
                parse_mode: 'Markdown',
            });
        });
    }
    /**
     * 
     * @param {function(Object<string,AnwbRoadEntry>):void} callback 
     */
    doApiCall(callback) {
        if (cache == null) {
            https.get('https://www.anwb.nl/feeds/gethf', res => bodyparser.parseJson(res, (body) => {
                cache = {};
                for (let entry of body.roadEntries) {
                    cache[entry.road] = entry;
                }
                callback(cache);
                setTimeout(() => cache = null, 60000);
            }));
        }
        else
            callback(cache);
    }
}

module.exports = new PickupLine();