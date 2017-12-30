const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const PresidentPickChancellorState = require('./presidentpickchancellorstate');
const PolicyDeck = require('./policydeck');

const Execution = require('./presidentactions/execution');
const CallSpecialElection = require('./presidentactions/callspecialelection');
const InvestigateLoyalty = require('./presidentactions/investigateloyalty');
const PolicyPeek = require('./presidentactions/policypeek');
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
        game.alivePlayers = game.turnOrder.length;
        game.drawDeck = PolicyDeck.create();
        game.discardDeck = [];
        game.fascistsCardsPlayed = 3;
        game.liberalCardsPlayed = 0;
        game.electionTracker = 0;
        if(game.playerCount < 7){ //5 or 6 players
            game.presidentActions = [null, null, PolicyPeek, Execution, Execution, null];
        }else if(game.playerCount > 8){ //9 or 10 players
            game.presidentActions = [InvestigateLoyalty, InvestigateLoyalty, CallSpecialElection, Execution, Execution, null];
        }else{ //7 or 8 players
            game.presidentActions = [null, InvestigateLoyalty, CallSpecialElection, Execution, Execution, null];
        }
        let message = 'Because this is a chat, and not a table, the turn order is randomized.\nThis game\'s turn order is:';
        let i = 0;
        for(let playerId of game.turnOrder){
            let player = game.players[playerId];
            player.seat = i;
            player.confirmedNotHitler = false;
            player.alive = true;
            i++; //this way i is parsed as 1-indexed, but saved as 0-indexed.
            message += `\n${i}) ${this.parseUserName(game.players[playerId])}`;
        }
        let callback = () => this.game.setState(new PresidentPickChancellorState(0));
        this.sendMessageToGroup({message, callback});
        console.log('init state', game);
    }
}
module.exports = InitGameState;