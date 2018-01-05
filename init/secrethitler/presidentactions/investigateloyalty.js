const PresidentAction = require('./presidentaction');
const PrivateMessage = require('../privateMessage');
class InvestigateLoyalty extends PresidentAction{
    getDescription(){
        return 'The president is allowed to investigate someone\'s allegiance';
    }
    onStartState(game){
        super.onStartState(game);
        /**
         * @type {number}
         */
        this.target = undefined;
        this.victims = Array.from(this.game.alive(p => p.id != this.president.id));
        let msg = this.getMessage();
        let callback = (msg) => this.message = msg.result.message_id;
        this.sendMessageToUser(this.president, new PrivateMessage('investigate_loyalty', msg.message, null, callback, msg.keyboard));
    }
    getMessage(){
        let keyboard = this.getKeyboardForPlayers(this.victims, 'investigate', p => this.parseUserName(p));
        if(this.target !== undefined)
            keyboard.push([this.getButton(`Investigate ${this.parseUserName(this.victims[this.target])}`, 'confirm-investigate')]);
        return {
            message: 'Whose allegiance would you like to investigate',
            keyboard
        }
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
        if(name == 'investigate'){
            let [index] = params;
            this.target = index;
            let msg = this.getMessage();
            if(this.message)
                this.editPrivateMessage(this.president, this.message, msg.message, msg);
            else
                this.sendMessageToUser(this.president, new PrivateMessage('investigate_loyalty', msg.message, null, callback, msg.keyboard));

        }else if(name == 'confirm-investigate'){
            let target = this.victims[this.target];
            let message = `${this.parseUserName(target)} is a ${target.role.faction}`;
            if(this.message)
                this.editPrivateMessage(this.president, this.message, message);
            else
                this.sendMessageToUser(this.president, new PrivateMessage('player_loyalty', message, target.role.faction));
            this.sendMessageToGroup({message: `${this.parseUserName(this.president)} has investigated ${this.parseUserName(target)}`});
            this.switchToNextPresidentState();
            return message;
        }else
            return super.handleInput(game, msg, name);
    }
    /**
     * @param {string} playerName 
     */
    getAnnouncementMessage(playerName){
        return `${playerName} is investigating someone's allegiance!`;
    }
}
module.exports = InvestigateLoyalty;