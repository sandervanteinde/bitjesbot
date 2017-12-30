const PresidentAction = require('./presidentaction');
class PolicyPeek extends PresidentAction{
    getDescription(){
        return 'The president gets to see the top 3 policy cards';
    }
    onStartState(game){
        super.onStartState(game);
        if(this.game.drawDeck.length < 3)
            this.shuffleDiscardIntoDrawDeck();
        let [card1, card2, card3] = this.game.drawDeck;
        let message = `The top 3 cards are as follows:\n1) ${card1.faction}\n2) ${card2.faction}\n3) ${card3.faction}`;
        this.sendMessageToUser(this.president, {message});
        this.switchToNextPresidentState();
    }
    /**
     * @param {string} playerName 
     */
    getAnnouncementMessage(playerName){
        return `${playerName} is peeking at the top 3 policy cards`;
    }
}
module.exports = PolicyPeek;