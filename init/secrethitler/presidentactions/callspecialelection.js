const PresidentAction = require('./presidentaction');
const PresidentPickChancellorState = require('../presidentpickchancellorstate');
const PrivateMessage = require('../privateMessage');
class CallSpecialElection extends PresidentAction{
    getDescription(){
        return 'The president is allowed to choose who gets elected as next president';
    }
    onStartState(game){
        super.onStartState(game);

        this.victims = Array.from(this.game.alive(p => p.id != this.president.id));
        /**
         * @type {number}
         */
        this.target = undefined;
        this.game.specialElectionPresident = this.game.president;
        let msg = this.getMessage();
        msg.callback = m => this.message = m.result.message_id;
        this.sendMessageToUser(this.president, new PrivateMessage('special_election', msg.message, null, msg.callback, msg.keyboard));
    }
    getMessage(){
        let keyboard = this.getKeyboardForPlayers(this.victims, 'make-president', p => this.parseUserName(p));
        if(this.target)
            keyboard.push([this.getButton(`Make ${this.parseUserName(this.victims[this.target])} president`, 'confirm-make-president')]);
        return {
            message: 'Who would you like to elect as president next turn',
            keyboard
        };
    }
    /**
     * @param {string} playerName 
     */
    getAnnouncementMessage(playerName){
        return `${playerName} is choosing the next president.`;
    }
    
    
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramInlineQuery} msg 
     * @param {string} name 
     * @param {string[]} params 
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        if(msg.from.id != this.president.id)
            return 'What are you doing here, trying to hack this bot? I\'ll just 403 your ass!';
        if(name == 'make-president'){
            [this.target] = params;
            let msg = this.getMessage();
            if(this.message)
                this.editPrivateMessage(this.president, this.message, msg.message, msg);
            else
                this.sendMessageToUser(this.president, new PrivateMessage('special_election', msg.message, null, msg.callback, msg.keyboard));
        }else if(name == 'confirm-make-president'){
            let target = this.victims[this.target];
            this.game.setState(new PresidentPickChancellorState(target.seat));
            return `You chose ${this.parseUserName(target)} as the new president`;
        }else
            return super.handleInput(game, msg, name);
    }
    onReconnect(player){
        if(player.id == this.president.id){
            let msg = this.getMessage();
            this.sendMessageToUser(this.president, new PrivateMessage('special_election', msg.message, null, msg.callback, msg.keyboard));
        }
    }
}
module.exports = CallSpecialElection;