const GameState = require('./gamestate');
const PolicyCard = require('./policycard');
const SecretHitlerGame = require('./secrethitlergame');
const EndOfLegislativeState = require('./endoflegislativestate');
const VetoState = require('./vetostate');
const Emoji = require('../../utils/emoji');
const PrivateMessage = require('./privateMessage');
class LegislativeStateChancellor extends GameState{
    /**
     * @param {PolicyCard[]} cards 
     */
    constructor(cards){
        super();
        this.cards = cards;
        /**
         * @type {number}
         */
        this.playCard = undefined;
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        this.chancellor = this.getPlayerBySeat(game.chancellor);
        this.president = this.getPlayerBySeat(game.president);
        let msg = this.getMessage();
        msg.callback = (msg) => this.message = msg.result.message_id;
        this.sendMessageToUser(this.chancellor, new PrivateMessage('pick_card_chancellor', msg.message, this.cards, msg.callback, msg.keyboard));
    }
    getMessage(){
        let keyboard = [];
        for(let i = 0; i < 2; i++){
            let card = this.cards[i];
            keyboard.push([this.getButton(`${i + 1}) ${i == this.playCard && Emoji.checkMark || Emoji.crossMark} ${card.faction} Card`, 'pick-card', i)]);
        }
        if(this.game.fascistsCardsPlayed == 5 && !this.noVeto)
            keyboard.push([this.getButton('VETO!', 'veto')]);
        if(this.playCard !== undefined)
            keyboard.push([this.getButton(`Play the ${this.cards[this.playCard].faction} card`, 'confirm-card')]);
        return {
            message: `${this.parseUserName(this.president)} has sent you the following cards.\nPick the one you would like to play.`,
            keyboard
        }
    }
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramInlineQuery} msg 
     * @param {string} name 
     * @returns {string|void}
     */
    handleInput(game, msg, name, index){
        if(msg.from.id != this.chancellor.id)
            return 'What are you doing here, trying to hack this bot? I\'ll just 403 your ass!';
        if(name == 'pick-card'){
            this.playCard = index;
            let msg = this.getMessage();
            if(this.message)
                this.editPrivateMessage(this.chancellor, this.message, msg.message, msg);
            else
                this.sendMessageToUser(this.chancellor, new PrivateMessage('pick_card_chancellor', msg.message, this.cards, msg.callback, msg.keyboard));
        }else if(name == 'confirm-card'){
            let [pickedCard] = this.cards.splice(this.playCard, 1);
            let [discardCard] = this.cards;
            game.discardDeck.push(discardCard);
            if(this.message)
                this.editPrivateMessage(this.chancellor, this.message, `You played the ${pickedCard.faction} card`);
            game.setState(new EndOfLegislativeState(pickedCard));
            this.emitEvent('chancellor_plays_card', pickedCard);
        }else if(name == 'veto'){
            this.emitEvent('chancellor_request_veto');
            game.setState(new VetoState(this));
            if(this.message)
                this.editPrivateMessage(this.chancellor, this.message, 'Awaiting reply for veto-request...');
            else
                this.sendMessageToUser(this.chancellor, new PrivateMessage('chancellor_await_veto', 'Awaiting reply for veto-request...'));
        }else
            return super.handleInput(game, msg, name);
    }
    vetoNotAllowed(){
        this.noVeto = true;
        let msg = this.getMessage();
        if(this.message)
            this.editPrivateMessage(this.chancellor, this.message, msg.message, msg);
        else
            this.sendMessageToUser(this.chancellor, new PrivateMessage('pick_card_chancellor', msg.message, this.cards, msg.callback, msg.keyboard));
        this.emitEvent('veto_not_allowed');
    }
    vetoAllowed(){
        if(this.message)
            this.editPrivateMessage(this.chancellor, this.message, 'The veto was allowed!');
        this.emitEvent('veto_allowed');
    }
}
module.exports = LegislativeStateChancellor;