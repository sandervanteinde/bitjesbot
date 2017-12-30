const PolicyCard = require('./policycard');
const Faction = require('./faction');
const arrayUtil = require('../../utils/arrayutil');
class PolicyDeck{
    /**
     * @param {boolean} [shuffled]
     * @returns {PolicyCard[]}
     */
    create(shuffled = true){
        /**
         * @type {PolicyCard[]}
         */
        let deck = [];
        for(let i = 0; i < 11; i++)
            deck.push(new PolicyCard(Faction.Fascist));
        for(let i = 0; i < 6; i++)
            deck.push(new PolicyCard(Faction.Liberal));

        if(shuffled)
            arrayUtil.shuffle(deck, 200);
        return deck;
    }
}
module.exports  = new PolicyDeck();