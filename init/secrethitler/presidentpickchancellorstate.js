const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
class PresidentPickChancellorState extends GameState{
    /**
     * @param {number} newPresidentSeatId  The seat id of the new president
     */
    constructor(newPresidentSeatId){
        this.newPresidentSeatId = newPresidentSeatId;
    }
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        game.president = this.newPresidentSeatId;
        game.chancellor = -1;
    }
}
module.exports = PresidentPickChancellorState;