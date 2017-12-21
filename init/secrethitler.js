const bot = require('./bot');
const keyboard = require('../utils/keyboard');
const SecretHitlerGame = require('./secrethitler/secrethitlergame');

class SecretHitler{
    constructor(){
        bot.registerSlashCommand('secrethitler', 'Starts a game of Secret Hitler!', (...params) => this.onGameRequested(...params));
        keyboard.registerCallback('secr-hit', (...params) => this.onKeyboardResponse(...params));
        bot.registerSlashCommand('secrethitlertestmode', null, (...params) => this.onSetTestMode(...params));
        /**
         * @type {Object<number, SecretHitlerGame>}
         */
        this.games = {};
    }
    onKeyboardResponse(msg, secrHit, [chatId, callbackName, ...params]){
        let game = this.games[chatId];
        if(!game){
            bot.editMessage(msg.message.chat.id, msg.message.message_id, 'Something went wrong!');
            return;
        }
        let response = game.handleButtonCallback(msg, callbackName, ...params);
        if(response){
            msg.answered = true;
            bot.answerCallbackQuery(msg.id, {notification: response});
        }
    }
    onGameRequested(msg){
        if(msg.chat.type != 'group')
            bot.sendMessage({chatId: msg.chat.id, message: 'Secret Hitler is only enabled in groups'});
        else if(this.games[msg.chat.id])
            bot.sendMessage({chatId: msg.chat.id, message: 'A game of secret hitler is already ongoing!'});
        else
        {
            let game = new SecretHitlerGame(msg.chat.id, msg.from);
            this.games[msg.chat.id] = game;
        }
    }
    onSetTestMode(msg, slashCmd, playerCount = 5){
        let game = this.games[msg.chat.id];
        if(!game) return;
        playerCount = Number(playerCount) || 5;
        game.enableTestMode(playerCount);
    }
}



module.exports = new SecretHitler();