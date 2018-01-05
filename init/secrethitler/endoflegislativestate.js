const GameState = require('./gamestate');
const PolicyCard = require('./policycard');
const SecretHitlerGame = require('./secrethitlergame');
const Faction = require('./faction');
const WinState = require('./winstate');
/**
 * This state handles all logic that happens at the end of a round
 * Including defining if there's a winner and performing President Actions if they are supposed to be done
 */
class EndOfLegislativeState extends GameState{
    /**
     * @param {PolicyCard} card 
     * @param {boolean} byPresident defines if the president played this or the country
     */
    constructor(card, byPresident = true){
        super();
        this.playCard = card;
        this.byPresident = byPresident;
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        if(this.byPresident){
            this.game.previousChancellor = this.game.chancellor;
            this.game.previousPresident = this.game.president;
            this.emitEvent('new_previous_president', this.game.president);
            this.emitEvent('new_previous_chancellor', this.game.chancellor);
        }
        this.sendMessageToGroup({message: `A ${this.playCard.faction} card was played!`});
        if(this.playCard.faction == Faction.Fascist){
            let newCount = ++game.fascistsCardsPlayed;
            if(newCount == 6){
                game.setState(new WinState(Faction.Fascist, 'The fascists enacted 6 policies'));
                return;
            }
            let state = game.presidentActions[newCount - 1]; //0-indexed, thus - 1
            if(state && this.byPresident)
                game.setState(new state());
            else{
                this.setNewPresident();
            }
        }else{ //liberal
            if(++game.liberalCardsPlayed == 5){
                game.setState(new WinState(Faction.Liberal, 'The liberals enacted 5 policies'));
                return;
            }
            this.setNewPresident();
        }
    }
    setNewPresident(){
        let newPresidentId = this.game.getNextPresident();
        let PresidentPickChancellorState = require('./presidentpickchancellorstate');
        this.game.setState(new PresidentPickChancellorState(newPresidentId));
    }
}
module.exports = EndOfLegislativeState;