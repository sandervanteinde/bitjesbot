const PresidentAction = require('./presidentaction');
const Emoji = require('../../../utils/emoji');
const WinState = require('../winstate');
const Faction = require('../faction');
const PrivateMessage = require('../privateMessage');
class Execution extends PresidentAction{
    getDescription(){
        return 'The president may choose one person to kill';
    }
    onStartState(game){
        super.onStartState(game);
        this.victims = Array.from(this.game.alive(p => p.id != this.president.id));
        /**
         * @type {number}
         */
        this.targetIndex = undefined;
        let msg = this.getMessage();
        let callback = (msg) => this.message = msg.result.message_id;
        this.sendMessageToUser(this.president, new PrivateMessage('shoot_player', msg.message, null, callback, msg.keyboard));
    }
    getMessage(){
        let keyboard = this.getKeyboardForPlayers(this.victims, 'shoot', (p, i) => `${this.parseUserName(p)} ${i == this.targetIndex && Emoji.skull || ''}`)
        if(this.targetIndex !== undefined)
            keyboard.push([this.getButton(`Shoot ${this.parseUserName(this.victims[this.targetIndex])}`, 'confirm-shoot')]);
        return {
            message: 'Who would you like to shoot?',
            keyboard: keyboard
        }
    }
    /**
     * @param {string} playerName 
     */
    getAnnouncementMessage(playerName){
        return `${playerName} is choosing who to kill`;
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
        if(name == 'confirm-shoot'){
            let target = this.victims[this.targetIndex];
            target.alive = false;
            this.game.alivePlayers--;
            let privMsg = `You shot ${this.parseUserName(target)}`;
            if(this.message)
                this.editPrivateMessage(this.president, this.message, privMsg);
            this.sendMessageToGroup({message: `${this.parseUserName(this.president)} has shot ${this.parseUserName(target)}`});
            if(target.role.isHitler)
                this.game.setState(new WinState(Faction.Liberal, 'Hitler was shot!'));
            else
                this.switchToNextPresidentState();
            return privMsg;
        }else if(name == 'shoot'){
            let [index] = params;
            this.targetIndex = index;
            let msg = this.getMessage();
            if(this.message)
                this.editPrivateMessage(this.president, this.message, msg.message, msg);
            else{
                let callback = (msg) => this.message = msg.result.message_id;
                this.sendMessageToUser(this.president, new PrivateMessage('shoot_player', msg.message, null, callback, msg.keyboard));
            }
        }else
            super.handleInput(game, msg, name, ...params);
    }
}
module.exports = Execution;