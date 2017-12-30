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
class SecretHitlerGame{
    constructor(chatId, host){
        this.chatId = chatId;
        this.host = host;
        /**
         * @type {Object<number,Player>}
         */
        this.players = {};
        this.playerCount = 0;
        this.testMode = false;
        /**
         * @type {GameState}
         */
        this.setState(new JoinGameState());
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
    enableTestMode(count){
        if(this.state.enableTestMode)
            this.state.enableTestMode(count);
    }
    /**
     * @param {GameState} state 
     */
    setState(state){
        if(this.state)
            this.state.onEndState(this);
        this.state = state;
        if(this.state)
            this.state.onStartState(this);
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