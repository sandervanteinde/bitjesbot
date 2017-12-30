const SecretHitlerGame = require('./secrethitlergame');
const keyboard = require('../../utils/keyboard');
const bot = require('../bot');
const Player = require('./player');
const PolicyCard = require('./policycard');
const arrayUtil = require('./../../utils/arrayutil');
const Emoji = require('../../utils/emoji');

class GameState{
    constructor(){
        if(this.constructor == GameState)
            throw 'Can\'t construct the abstract class GameState';
    }
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramInlineQuery} msg 
     * @param {string} name 
     * @param {string[]} params 
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        console.error(`Unhandled input received in Secret Hitler State: ${this.constructor.name}`, {name, params});
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        this.game = game;
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onEndState(game){

    }
    /**
     * 
     * @param {string} text 
     * @param {string} callbackName 
     * @param {string[]} params 
     */
    getButton(text, callbackName, ...params){
        return keyboard.button(text, `secr-hit`, this.game.chatId, callbackName, ...params)
    }
    onMessageSent(callback, ...params){
        let game = this.game;
        game.isMessageBeingSent = false;
        if(callback)
            callback(...params);
        if(game.queuedMessages.length > 0)
        {
            let [msg] = game.queuedMessages.splice(0, 1);
            msg();
        }
    }
    /**
     * @param {*} options 
     */
    sendMessageToGroup(options = {message: '', keyboard: null, callback: null}){
        let callback = options.callback;
        let game = this.game;
        options.chatId = this.game.chatId;
        options.callback = (...params) => this.onMessageSent(callback, ...params);
        if(game.isMessageBeingSent)
            game.queuedMessages.push(() => this.sendMessageToGroup(options))
        else{
            game.isMessageBeingSent = true;
            bot.sendMessage(options);
        }
    }
    /**
     * @param {number} msgId 
     * @param {string} message 
     * @param {*} obj 
     * @returns {void}
     */
    editGroupMessage(msgId, message, obj = {keyboard: null, parse_mode: null}){
        bot.editMessage(this.game.chatId, msgId, message, obj);
    }

    /**
     * @param {Player} user
     * @param {number} msgId 
     * @param {string} message 
     * @param {*} obj 
     * @returns {void}
     */
    editPrivateMessage(user, msgId, message, obj = {keyboard: null, parse_mode: null}){
        bot.editMessage(user.id, msgId, message, obj);
    }
    /**
     * 
     * @param {Player} user 
     * @param {*} options 
     * @returns {void}
     */
    sendMessageToUser(user, options = {message: '', keyboard: null}){
        if(typeof user.id == 'string' && user.id.startsWith('TEST')){
            return this.sendTestPersonPrivateMessageToConsole(user, options);
        }
        options.chatId = user.id;
        bot.sendMessage(options);
    }
    sendTestPersonPrivateMessageToConsole(user, options = {message: '', keyboard: null}){
        let {message, keyboard, callback} = options;
        console.log(`Sending private message to ${user.id}: ${message}`);
        if(keyboard){
            console.log('Available keyboard:')
            for(let i = 0; i < keyboard.length; i++)
            {
                let row = keyboard[i];
                for(let j = 0; j < row.length; j++){
                    /**
                     * @type {TelegramInlineKeyboardButton}
                     */
                    let button = row[j];
                    console.log(`${i}/${j}: ${button.text} (${button.callback_data})`);
                }
            }
        }
        if(callback){
            callback({ok: true, result: {message_id: false}});//mock test data?
        }
    }
    /**
     * @param {Player} user 
     * @returns {string}
     */
    parseUserName(user){
        if(user.username)
            return `@${user.username}`;
        else{
            let name = user.first_name;
            if(user.last_name){
                name = `${name} ${user.last_name}`;
            }
            return name;
        }
    }
    /**
     * @param {number} seatId
     * @returns {Player}
     */
    getPlayerBySeat(seatId){
        return this.game.players[this.game.turnOrder[seatId]];
    }
    
    /**
     * @param {Player} sender 
     * @param {number} seatId 
     * @returns {boolean}
     */
    isMessageSenderOnSeat(sender, seatId){
        return this.getPlayerBySeat(seatId).id == sender.id;
    }
    /**
     * 
     * @param {number} count 
     * @returns {PolicyCard[]}
     */
    drawPolicyCards(count){
        let game = this.game;
        if(game.drawDeck.length < count)
            this.shuffleDiscardIntoDrawDeck();
        return game.drawDeck.splice(0, 3);
    }
    shuffleDiscardIntoDrawDeck(){
        let game = this.game;
        this.sendMessageToGroup({message: `Shuffling the discard deck into the draw deck.`});
        game.drawDeck.push(...game.discardDeck);
        game.discardDeck = [];
        arrayUtil.shuffle(game.drawDeck, 100);
    }
    incrementElectionTracker(){
        let game = this.game;
        if(++game.electionTracker >= 3){
            game.electionTracker = 0;
            let [card] = this.drawPolicyCards(1);
            this.sendMessageToGroup({message: `The election tracker is at 3. The country will play a card!`});
            let EndOfLegislativeState = require('./endoflegislativestate'); //prevent circular dependency
            game.setState(new EndOfLegislativeState(card, false));
        }else{
            this.sendMessageToGroup({message: `The election tracker advanced to ${game.electionTracker}.\nAt 3, the country will play a card!`});
            let newPresident = game.getNextPresident();
            let presidentState = require('./presidentpickchancellorstate');//prevent circular dependency
            this.game.setState(new presidentState(newPresident));
        }
    }
    sendStatus(){
        let message = 'Current players (by turn Order):\n';
        let game = this.game;
        for(let id of game.turnOrder){
            let player = game.players[id];
            message += `\n${this.parseUserName(player)}${!player.alive && ` ${Emoji.skull}` || ''}`;
            let roles = [];
            if(player.seat == game.president)
                roles.push('president');
            if(player.seat == game.chancellor)
                roles.push('chancellor');
            if(player.seat == game.previousChancellor)
                roles.push('previous chancellor');
            if(player.seat == game.previousPresident)
                roles.push('previous president');
            if(player.confirmedNotHitler)
                roles.push('confirmed not hitler');
            if(roles.length > 0)
                message += ` : ${roles.join(' & ')}`;
        }
        this.sendMessageToGroup({message});
        let nextAction = game.presidentActions[game.fascistsCardsPlayed]; //0-indexed, thus fascistsCardsPlayed = index + 1
        message = `Current Board:

Fascists cards played: ${game.fascistsCardsPlayed}
Liberal cards played: ${game.liberalCardsPlayed}
Election tracker: ${game.electionTracker}
Cards in draw deck: ${game.drawDeck.length}
Cards in discard deck: ${game.discardDeck.length}
Next fascist action: ${nextAction && new nextAction().getDescription() || 'None'}`;
        this.sendMessageToGroup({message});
    }
}
module.exports = GameState;