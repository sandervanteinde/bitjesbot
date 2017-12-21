const SecretHitlerGame = require('./secrethitlergame');
class GameRegistry{
    constructor(){
        /**
         * @type {Object.<number,SecretHitlerGame>}
         */
        this.games = {};
    }
    /**
     * 
     * @param {number} id 
     * @param {SecretHitlerGame} obj 
     */
    registerGame(id, obj){
        this.games[id] = obj;
    }
    /**
     * @param {number} id 
     */
    removeGame(id){
        delete this.games[id];
    }
    /**
     * @param {number} id 
     * @returns {SecretHitlerGame}
     */
    getGame(id){
        return this.games[id];
    }
}
module.exports = new GameRegistry();