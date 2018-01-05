const GameState = require('./gamestate');
const PrivateMessage = require('./privateMessage');
class VetoState extends GameState{
    /**
     * @param {GameState} parentState 
     */
    constructor(parentState){
        super();
        this.parent = parentState;
    }
    onStartState(game){
        super.onStartState(game);
        this.chancellor = this.getPlayerBySeat(this.game.chancellor);
        this.president = this.getPlayerBySeat(this.game.president);
        this.sendMessageToGroup({message: `${this.parseUserName(this.chancellor)} has requested a VETO!`});
        this.sendMessageToUser(this.president, new PrivateMessage('veto_requested', 
            'The chancellor requested a VETO. Do you accept?',
            null,
            undefined,
            [[this.getButton('Ja!', 'veto-reply', 'yes'), this.getButton('Nein!', 'veto-reply', 'no')]]
        ));
    }
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramInlineQuery} msg 
     * @param {string} name 
     * @param {string[]} params 
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        if(name != 'veto-reply')
            return super.handleInput(game, msg, name);
        let votedYes = params[0] == 'yes';
        if(votedYes)
        {
            this.game.discardDeck.push(...this.parent.cards);
            this.sendMessageToGroup({message: 'The president has accepted the VETO!'});
            this.parent.vetoAllowed();
            this.incrementElectionTracker();
        }else{
            this.sendMessageToGroup({message: 'The president has declined the VETO!'});
            this.game.state = this.parent; //prevent onStartState from being called
            this.parent.vetoNotAllowed();
            this.onEndState();
        }
    }
}
module.exports = VetoState;