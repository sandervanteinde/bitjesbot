const SecretHitlerGame = require('./secrethitlergame');
const GameState = require('./gamestate');
const roles = require('./roles');
const arrayUtil = require('../../utils/arrayutil');
const config = require('../../config');
const InitGameState = require('./initgamestate');
const Player = require('./player');
const PrivateMessage = require('./privateMessage');
/**
 * The state when the host has decided to start the game.
 * In this state the roles are assigned and handed to the player.
 * If the player does not have PM's enabled, this state will sort that the proper notifcations are made
 */
class StartGameState extends GameState{
    constructor(){
        super();
        /**
         * @type {Object<number,boolean>}
         */
        this.rolesReceived = {};
        this.intervals = [];
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        this.sendMessageToGroup({message: 'Dividing the roles! You will be receiving a private message with your role!'});
        let copy = Array.from(roles);
        copy.splice(game.playerCount, 10 - game.playerCount);
        arrayUtil.shuffle(copy);
        let roleId = 0;
        for(let i in game.players)
            game.setPlayerRole(i, copy[roleId++]);
        this.announceRoles();
    }
    onEndState(game){
        for(let id of this.intervals)
            clearInterval(id);
    }
    announceRoles(){
        let game = this.game;
        this.announceFascist(Array.from(game.fascists()));
        this.announceLiberals(Array.from(game.liberals()));
        setTimeout(() => this.checkEveryoneReady(), 1500); //give the bot 1.5s time to send all roles
    }
    /**
     * 
     * @param {Player[]} fascists 
     */
    announceFascist(fascists){
        let hitlerIndex = fascists.findIndex((c => c.role.isHitler));
        let [hitler] = fascists.splice(hitlerIndex, 1);
        let msg = `You are a fascist\nHitler is: ${this.parseUserName(hitler)}`;
        if(fascists.length == 2)
            msg += '\nThe other fascist is:';
        else if(fascists.length > 2)
            msg += '\nThe other fascists are:';
        let data = [{id: hitler.id, role: 'Hitler'}];
        for(let fascist of fascists)
            data.push({id: fascist.id, role: 'Fascist'});
        for(let liberal of this.game.liberals())
            data.push({id: liberal.id, role: 'Liberal'});
        for(let i = 0; i < fascists.length; i++){
            let copy = msg;
            for(let j = 0; j < fascists.length; j++){
                if(i == j) continue;
                copy += `\n- ${this.parseUserName(fascists[j])}`;
            }
            this.announceToPlayer(fascists[i], copy, data);
        }
        let hitlerMsg;
        if(this.game.playerCount < 7)
            hitlerMsg = `You are hitler!\nThe other fascist is:\n- ${this.parseUserName(fascists[0])}`;
        else{
            hitlerMsg = 'You are hitler!\nYou do not know who the fascists are.';
            data = [data[0]]; //only annonce Hitler himself to hitler
        }
        this.announceToPlayer(hitler, hitlerMsg, data);
    }
    /**
     * @param {Player[]} liberals 
     */
    announceLiberals(liberals){
        for(let liberal of liberals)
            this.announceToPlayer(liberal, 'You are liberal!\nYou do not know who hitler, the fascists, or the other liberals are', [{id: liberal.id, role: 'Liberal'}]);
    }
    /**
     * 
     * @param {Player} player 
     * @param {string} message 
     */
    announceToPlayer(player, message, data){
        let playerId = player.id;
        this.rolesReceived[playerId] = false;
        this.sendMessageToUser(player,new PrivateMessage(
            'announce_role',
            message,
            data,
            msg => this.rolesReceived[playerId] = true,
            undefined,
            err => {
                if(err.error_code == 403){
                    this.sendMessageToGroup({
                        message: `${this.parseUserName(player)}: I was unable to send you a direct message.\nGo to @${config.botName} and start the bot to allow me to PM you!\nYou have 60 seconds to respond or the game will be terminated.`
                    });
                    this.attemptResendRole(player, message, data);
                }
            }
        ));
    }
    /**
     * @param {Player} player 
     * @param {string} message 
     */
    attemptResendRole(player, message, data){
        let interval;
        this.intervals.push(interval = setInterval(() => {
            this.sendMessageToUser(player, new PrivateMessage(
                'announce_role',
                message,
                data,
                () => {
                    clearInterval(interval);
                    let index = this.intervals.indexOf(interval);
                    this.intervals.splice(index, 1);
                    this.rolesReceived[player.id] = true;
                    this.checkEveryoneReady();
                },
                undefined,
                () => {} //do nothing with the error, we know this can fail and already handled it by this code
            ));
        }, 60000));
        if(this.intervals.length == 1){
            setTimeout(() => {
                for(let i in this.rolesReceived)
                    if(!this.rolesReceived[i])
                        this.cancelGameDueToInactiveUser();
            }, 10000);
        }
    }
    checkEveryoneReady(){
        if(this.game.state != this) return;
        for(let i in this.rolesReceived){
            if(!this.rolesReceived[i])
                return;
        }
        this.game.setState(new InitGameState());
    }
    cancelGameDueToInactiveUser(){
        if(this.game.state != this) return;
        for(let i in this.rolesReceived)
            if(!this.rolesReceived[i]){
                this.sendMessageToGroup({
                    message: 'The game has been cancelled due to an inactive user.'
                });
                let joinstate  = require('./joingamestate'); //prevent circular dependancy on load
                this.game.setState(new joinstate());
                return;
            }
    }

}
module.exports = StartGameState;