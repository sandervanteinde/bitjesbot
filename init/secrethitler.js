const bot = require('./bot');
const keyboard = require('../utils/keyboard');
const SecretHitlerGame = require('./secrethitler/secrethitlergame');
const GameRegistry = require('./secrethitler/gameregistry');

class SecretHitler{
    constructor(){

        keyboard.registerCallback('secr-hit', (...params) => this.onKeyboardResponse(...params));

        bot.registerSlashCommand('secrethitler', 'Starts a game of Secret Hitler!', (...params) => this.onGameRequested(...params), {groupOnly: true});
        bot.registerSlashCommand('shstatus', 'Requests the status of the current Secret Hitler game.', (...params) => this.onStatusRequested(...params), {groupOnly: true});

        bot.registerSlashCommand('secrethitlertestmode', null, (...params) => this.onSetTestMode(...params), {groupOnly: true});
        bot.registerSlashCommand('testsh', null, (...params) => this.onTestCommand(...params), {groupOnly: true});
    }
    /**
     * 
     * @param {TelegramCallbackQuery} msg 
     * @param {'secr-hit'} secrHit 
     * @param {*} param2 
     */
    onKeyboardResponse(msg, secrHit, [chatId, callbackName, ...params]){
        let game = GameRegistry.getGame(chatId);
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
    /**
     * @param {TelegramMessage} msg 
     */
    onGameRequested(msg){
        if(GameRegistry.getGame(msg.chat.id))
            bot.sendMessage({chatId: msg.chat.id, message: 'A game of secret hitler is already ongoing!'});
        else
        {
            let game = new SecretHitlerGame(msg.chat.id, msg.from);
            GameRegistry.registerGame(msg.chat.id, game);
        }
    }
    /**
     * @param {TelegramMessage} msg 
     * @param {string} slashCmd 
     */
    onStatusRequested(msg, slashCmd){
        let game = GameRegistry.getGame(msg.chat.id);
        if(!game)
            return bot.sendMessage({chatId: msg.chat.id, message: 'There is no Secret Hitler game being played in this group.', replyId: msg.message_id});
        game.sendStatus();
    }
    /**
     * @param {TelegramMessage} msg 
     * @param {string} slashCmd 
     * @param {number} playerCount 
     */
    onSetTestMode(msg, slashCmd, playerCount = 5){
        let game = GameRegistry.getGame(msg.chat.id);
        if(!game){
            this.onGameRequested(msg);
            game = GameRegistry.getGame(msg.chat.id);
            if(!game) return;
        }
        playerCount = Number(playerCount) || 5;
        game.enableTestMode(playerCount);
    }
    /**
     * @param {TelegramMessage} msg 
     * @param {string} slashCmd 
     * @param {number} testId 
     * @param {string} command
     * @param {string[]} params
     */
    onTestCommand(msg, slashCmd, testId, command, ...params){
        let game = GameRegistry.getGame(msg.chat.id);
        if(!game) return;
        if(!game.testMode)
            return bot.sendMessage({chatId: msg.chat.id, message: 'This command is only available to test games'});
        let ids = [];
        if(testId == 'ALL'){
            for(let id in game.players){
                if(id.startsWith('TEST'))
                    ids.push(id);
            }
        }
        else
            ids.push(`TEST${testId}`);
        let forgedMsg = {
            from: {
                id: undefined
            },
            forged: true
        }
        for(let id of ids){
            forgedMsg.from.id = id;
            let str = game.handleButtonCallback(forgedMsg, command, ...params);
            if(str)
                console.log(`${id} received notification: ${str}`);
        }
    }
}



module.exports = new SecretHitler();