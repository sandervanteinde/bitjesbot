const Module = require('../secrethitler');
const GameState = require('./gamestate');
const bot = require('../bot');
const keyboard = require('../../utils/keyboard');
const JoinGameState = require('./joingamestate');
const Role = require('./role');
const Faction = require('./faction');
const arrayUtil = require('../../utils/arrayutil');
const Player = require('./player');
const PolicyCard = require('./policycard');
const PresidentAction = require('./presidentactions/presidentaction');
const EventEmitter = require('events');
const PrivateMessage = require('./privateMessage');
class SecretHitlerEventEmitter extends EventEmitter{
    constructor(){
        super();
        this.jokers = [];
    }
    on(event, callback){
        if(event == '*')
            this.jokers.push(callback);
        else
            super.on(event, callback);
    }
    removeListener(event, callback){
        if(event == '*')
        {
            let index = this.jokers.indexOf(callback);
            if(index >= 0)
                this.jokers.splice(index, 1);
        }
        else
            super.removeListener(event, callback);
    }
    emit(event, ...params){
        for(let callback of this.jokers)
            callback(event, ...params);
        super.emit(event, ...params);
    }
}
class SecretHitlerGame{
    constructor(chatId, host){
        this.allowWebChat = true;
        this.chatId = chatId;
        this.host = host;
        /**
         * @type {Object<number,Player>}
         */
        this.players = {};
        this.playerCount = 0;
        this.testMode = false;

        /**
         * The turn order. Each entry is the player id as seen in this.players
         * @type {number[]}
         */
        this.turnOrder = [];
        /**
         * The seat ID of the president
         * @type {number}
         */
        this.president = -1;
        /**
         * The seat ID of the Chancelor
         * @type {number}
         */
        this.chancellor = -1;
        /**
         * The seat ID of the previous elected President
         * @type {number}
         */
        this.previousPresident = -1;
        /**
         * The seat ID of the previous elected Chancellor
         * @type {number}
         */
        this.previousChancellor = -1;
        /**
         * The amount of alive people
         * @type {number}
         */
        this.alivePlayers = -1;
        /**
         * @type {PolicyCard[]}
         */
        this.drawDeck = undefined;
        /**
         * @type {PolicyCard[]}
         */
        this.discardDeck = undefined;
        /**
         * @type {boolean}
         */
        this.isMessageBeingSent = false;
        /**
         * @type {Function[]}
         */
        this.queuedMessages = [];
        /**
         * @type {number}
         */
        this.fascistsCardsPlayed = -1;
        /**
         * @type {number}
         */
        this.liberalCardsPlayed = -1;
        /**
         * @type {PresidentAction[]}
         */
        this.presidentActions = [];
        /**
         * @type {number}
         */
        this.electionTracker = -1;
        /**
         * @type {number} seatId of the president
         */
        this.specialElectionPresident = undefined;
        /**
         * @type {Object.<string, string>}
         */
        this.reconnectIds = {};
        this.eventEmitter = new SecretHitlerEventEmitter();
        this.setState(new JoinGameState());
    }
    /**
     * @param {TelegramCallbackQuery} msg
     * @param {string} name 
     * @param {string[]} params
     * @returns {string|void}
     */
    handleButtonCallback(msg, name, ...params){
        return this.state.handleInput(this, msg, name, ...params);
    }
    /**
     * @returns {object} Object containing all info the web users can see
     */
    getWebsocketState(){
        let obj = {
            drawDeck: this.drawDeck && this.drawDeck.length || 17,
            discardDeck: this.discardDeck && this.discardDeck.length || 0
        };
        const ignores = {
            drawDeck: true,
            discardDeck: true,
            state: true,
            players: true,
            host: true,
            eventEmitter: true
        };
        for(let key in this){
            if(ignores[key]) continue;
            obj[key] = this[key];
        }
        let playerInfo = {};
        for(let playerId in this.players){
            playerInfo[playerId] = this.players[playerId].toJSON();
            if(this.host.id == playerId)
                obj.host = playerInfo[playerId];
        }
        obj.players = playerInfo;
        obj.state = this.state.constructor.name;
        return obj;
    }
    enableTestMode(count){
        if(this.state.enableTestMode)
            this.state.enableTestMode(count);
    }
    /**
     * @param {GameState} state 
     */
    setState(state){
        let oldState = this.state;
        if(oldState)
            oldState.onEndState(this);
        this.state = state;
        if(this.state)
            this.state.onStartState(this);
        state.emitEvent('state_changed', {old: oldState && oldState.constructor.name, new: state.constructor.name});
    }
    addReconnectId(guid, playerId){
        this.reconnectIds[guid] = playerId;
    }
    getPlayerIdForReconnectGUID(guid){
        return this.reconnectIds[guid];
    }
    reconnect(playerId){
        let player = this.players[playerId];
        let obj = {playerId};
        if(!(this.state instanceof JoinGameState)){
            obj.roles = [{id: playerId, role: player.role.isHitler && 'Hitler' || player.role.faction}];
            if(player.role.faction == 'Fascist' && (!player.role.isHitler || this.playerCount < 7)){
                for(let otherPlayer in this.players)
                    if(playerId != otherPlayer)
                        obj.roles.push({id: otherPlayer, role: this.players[otherPlayer].role.isHitler && 'Hitler' || this.players[otherPlayer].role.faction});
            }
        }
        this.state.sendMessageToUser(player, new PrivateMessage('reconnect_info', undefined, obj));
        this.state.emitEvent('state_changed', {new: this.state.constructor.name});
        this.state.onReconnect(player);

    }
    /**
     * @param {number} playerId 
     * @param {Role} role 
     */
    setPlayerRole(playerId, role){
        this.players[playerId].role = role;
    }
    randomizePlayerTurns(){
        let turnOrder = [];
        for(let i in this.players){
            turnOrder.push(i);
        }
        arrayUtil.shuffle(turnOrder, 20);
        this.turnOrder = turnOrder;
    }
    sendStatus(){
        this.state.sendStatus();
    }
    getNextPresident(){
        let currentPresident = this.president;
        if(this.specialElectionPresident !== undefined)
            currentPresident = this.specialElectionPresident;
            this.specialElectionPresident = undefined;
        do{
            currentPresident = (currentPresident + 1) % this.playerCount;
        }while(!this.players[this.turnOrder[currentPresident]].alive);
        return currentPresident;
    }
    /**
     * @returns {Iterable.<Player>}
     */
    *fascists(){
        for(let i in this.players)
        {
            let player = this.players[i];
            let role = this.players[i].role;
            if(role.faction == Faction.Fascist)
                yield player;
        }
    }
    /**
     * @returns {Iterable.<Player>}
     */
    *liberals(){
        for(let i in this.players)
        {
            let player = this.players[i];
            if(player.role.faction == Faction.Liberal)
                yield player;
        }
    }
    /**
     * @param {function(Player):boolean} predicate
     * @returns {Iterable.<Player>}
     */
    *alive(predicate = (player) => true){
        for(let i in this.players){
            let player = this.players[i];
            if(player.alive && predicate(player))
                yield player;
        }
    }
}
module.exports = SecretHitlerGame;