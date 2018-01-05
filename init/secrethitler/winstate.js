const GameState = require('./gamestate');
const Faction = require('./faction');
class WinState extends GameState{
    /**
     * @param {string} winner 
     * @param {string} reason
     */
    constructor(winner, reason){
        super();
        this.winner = winner;
        this.reason = reason;
    }
    onStartState(game){
        super.onStartState(game);
        this.sendMessageToGroup({message: `The ${this.winner} win!\n${this.reason}`});
        let JoinGameState = require('./joingamestate'); //prevent circular reference
        setTimeout(() => {
            let message = 'Players and their roles:';
            for(let id of this.game.turnOrder){
                let player = this.game.players[id];
                let role = player.role;
                message += `\n${this.parseUserName(player)}: ${role.isHitler && 'Hitler' || role.faction}`;
            }
            this.sendMessageToGroup({message});
        }, 5000);
        this.emitEvent('winner', {winner: this.winner, reason: this.reason, players: this.game.players});
        setTimeout(() => this.game.setState(new JoinGameState()), 10000);
    }
}
module.exports = WinState;