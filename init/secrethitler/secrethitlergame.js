const Module = require('../secrethitler');
const GameState = require('./gamestate');
const bot = require('../bot');
const keyboard = require('../../utils/keyboard');
const JoinGameState = require('./joingamestate');
const Role = require('./role');
const Faction = require('./faction');
const arrayUtil = require('../../utils/arrayutil');
class SecretHitlerGame{
    constructor(chatId, host){
        this.chatId = chatId;
        this.host = host;
        /**
         * @type {Object<number,object>}
         */
        this.players = {};
        /**
         * @type {Object<number,Role>}
         */
        this.roles = {};
        this.playerCount = 0;
        this.testMode = false;
        /**
         * @type {GameState}
         */
        this.setState(new JoinGameState());
        /**
         * The turn order. Each entry is the player id as seen in this.players and this.roles
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
    }
    /**
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
        this.roles[playerId] = role;
    }
    randomizePlayerTurns(){
        let turnOrder = [];
        for(let i in this.players){
            turnOrder.push(i);
        }
        arrayUtil.shuffle(turnOrder, 20);
        this.turnOrder = turnOrder;
    }
    *fascists(){
        for(let i in this.roles)
        {
            let role = this.roles[i];
            if(role.faction == Faction.Fascist)
                yield {player:this.players[i], role: role};
        }
    }
    *liberals(){
        for(let i in this.roles)
        {
            let role = this.roles[i];
            if(role.faction == Faction.Liberal)
                yield {player: this.players[i], role};
        }
    }
}
module.exports = SecretHitlerGame;