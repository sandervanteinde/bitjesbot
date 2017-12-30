const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const keyboard = require('../../utils/keyboard');
const Emoji = require('../../utils/emoji');
const PolicyCard = require('./policycard');
const LegislativeStateChancellor = require('./legislativestatechancellor');
class LegislativeStatePresident extends GameState{
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        this.president = this.getPlayerBySeat(game.president);
        this.sendMessageToGroup({message: `${this.parseUserName(this.president)} has drawn 3 policy cards.`});
        this.cards = [];
        for(let card of this.drawPolicyCards(3))
            this.cards.push({card, picked: false});
        let msg = this.getPickACardMessage(this.president);
        msg.callback = (msg) => this.message = msg.result.message_id;
        this.sendMessageToUser(this.president, msg);
    }
    getPickACardMessage(){
        let policyKeyboard = [];
        let totalPicked = 0;
        for(let i = 0; i < 3; i++){
            let entry = this.cards[i];
            if(entry.picked)
                totalPicked++;
            policyKeyboard.push([this.getButton(`${i + 1}) ${entry.picked && Emoji.checkMark || Emoji.crossMark} ${entry.card.faction} card`, 'pick-card', i)]);
        }
        if(totalPicked == 2)
            policyKeyboard.push([this.getButton(`Send these 2 cards to ${this.parseUserName(this.getPlayerBySeat(this.game.chancellor))}`, 'confirm-pick-card')]);
        return {
            message: `Please pick the cards you wish to give to the Chancellor`,
            keyboard: policyKeyboard,
            //callback: (msg) => this.message = msg.result.message_id,
        };
    }
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramInlineQuery} msg 
     * @param {string} name 
     * @param {number} index
     * @returns {string|void}
     */
    handleInput(game, msg, name, index){
        if(msg.from.id != this.president.id)
            return 'What are you doing here, trying to hack this bot? I\'ll just 403 your ass!';
        if(name == 'pick-card'){
            this.cards[index].picked = !this.cards[index].picked;
            let message = this.getPickACardMessage();
            if(this.message){
                this.editPrivateMessage(this.president, this.message, message.message, message);
            }else{
                message.callback = (msg) => this.message = msg.result.message_id;
                this.sendMessageToUser(this.president, message);
            }
        }else if(name == 'confirm-pick-card'){
            /**
             * @type {PolicyCard[]}
             */
            let pickedCards = [];
            /**
             * @type {PolicyCard}
             */
            let discardCard;
            for(let entry of this.cards){
                if(entry.picked)
                    pickedCards.push(entry.card);
                else
                    discardCard = entry.card;
            }
            if(pickedCards.length != 2 || discardCard === undefined)
                return 'Something went wrong. Try again!';
            if(this.message){
                let msg = `You sent these cards to ${this.parseUserName(this.getPlayerBySeat(this.game.chancellor))}:`;
                for(let card of pickedCards)
                    msg += `\n- ${card.faction}`;
                this.editPrivateMessage(this.president, this.message, msg);
            }
            this.game.discardDeck.push(discardCard);
            this.game.setState(new LegislativeStateChancellor(pickedCards));
        }else
            return super.handleInput(game, msg, name);
    }
    onEndState(){
        this.sendMessageToGroup({message: `${this.parseUserName(this.president)} has discared a card and given 2 cards to ${this.parseUserName(this.getPlayerBySeat(this.game.chancellor))}`});
    }
}
module.exports = LegislativeStatePresident;