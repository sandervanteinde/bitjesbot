const SecretHitlerGame = require('./secrethitlergame');
const keyboard = require('../../utils/keyboard');
class GameState{
    constructor(){
        if(this.constructor == GameState)
            throw 'Can\'t construct the abstract class GameState';
    }
    /**
     * 
     * @param {SecretHitlerGame} game 
     * @param {any} msg 
     * @param {string} name 
     * @param {string[]} params 
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        console.error(`Unhandled input received in Secret Hitler State: ${this.constructor.name}`);
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
}
module.exports = GameState;