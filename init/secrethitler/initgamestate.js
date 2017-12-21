const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const PresidentPickChancellorState = require('./presidentpickchancellorstate');
/**
 * The game has started, roles have been announced, setup the first turn in this state.
 * This state also randomizes the turn order
 */
class InitGameState extends GameState{
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        game.randomizePlayerTurns();
        let message = 'Because this is a chat, and not a table, the turn order is randomized.\nThis game\'s turn order is:';
        let i = 1;
        for(let playerId of game.turnOrder){
            message += `\n${i++}) ${this.parseUserName(game.players[playerId])}`;
        }
        let callback = () => this.game.setState(new PresidentPickChancellorState());
        this.sendMessageToGroup({message});
    }
}
module.exports = InitGameState;