const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const keyboard = require('../../utils/keyboard');
const VoteForGovernment = require('./voteforgovernment');
const Player = require('./player');
/**
 * The state responsible for handling the president picking the Chancellor
 */
class PresidentPickChancellorState extends GameState{
    /**
     * @param {number} newPresidentSeatId  The seat id of the new president
     */
    constructor(newPresidentSeatId){
        super();
        this.newPresidentSeatId = newPresidentSeatId;
        this.pick_message = undefined;
    }
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        game.president = this.newPresidentSeatId;
        game.chancellor = -1;
        this.sendMessageToGroup({
            message: `${this.parseUserName(this.getPlayerBySeat(game.president))} is the president.\nThe president may now choose his/her chancellor`,
            keyboard: this.constructKeyboardForPresident(),
            callback: (msg) => this.pick_message = msg.result.message_id
        });
        this.emitEvent('new_president', this.newPresidentSeatId);
    }
    isInvalidChancellorCandidate(seat){
        let game = this.game;
        return seat == game.president || //the current president can't be chancellor
        seat == game.previousChancellor || //the previous Chancellor may never be the new chancellor
        (seat == game.previousPresident && game.alivePlayers > 5); //the previous president may be nominated with less then or equal to 5 people alive
    }
    constructKeyboardForPresident(){
        let game = this.game;
        let players = game.players;
        let eligiblePlayers = Array.from(game.alive(p => !this.isInvalidChancellorCandidate(p.seat)));
        let keyboard = [];
        let currentRow = [];
        for(let i = 0; i < eligiblePlayers.length; i++){
            let player = eligiblePlayers[i];
            currentRow.push(this.getButton(this.parseUserName(player), 'pick-chancellor', player.seat));
            if((i % 2) == 1){
                keyboard.push(currentRow);
                currentRow = [];
            }
        }
        if(currentRow.length > 0)
            keyboard.push(currentRow);
        return keyboard;
    }
    
    handleInput(game, msg, name, ...params){
        if(name != 'pick-chancellor')
            return super.handleInput(game, msg, name, ...params);
        if(!this.isMessageSenderOnSeat(msg.from, this.game.president))
            return 'You are not the president. Please don\'t interact with the buttons.';
        let [seatId] = params;
        if(this.isInvalidChancellorCandidate(seatId))
            return 'This candidate is not eligible to be a chancellor';
        let player = this.getPlayerBySeat(seatId);
        this.game.chancellor = seatId;
        this.emitEvent('new_chancellor', seatId);
        this.game.setState(new VoteForGovernment());
        //VoteForGovernment state is responsible for sending the message that the Chancellor is chosen. This way it can add the keyboard buttons required
        return `You picked ${this.parseUserName(player)}`;
    }
    onEndState(){
        if(this.pick_message){
            let game = this.game;
            let president = this.getPlayerBySeat(game.president);
            let chancellor = this.getPlayerBySeat(game.chancellor);
            this.editGroupMessage(this.pick_message, `${this.parseUserName(president)} has chosen ${this.parseUserName(chancellor)} as his/her chancellor`);
        }
    }
    /**
     * @param {Player} player 
     */
    onReconnect(player){
        if(this.game.president == player.seat)
            player.privateMessageHandler.handleEvent('new_president', this.newPresidentSeatId);
    }
}
module.exports = PresidentPickChancellorState;