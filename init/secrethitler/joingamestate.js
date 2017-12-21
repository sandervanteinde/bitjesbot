const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const StartGameState = require('./startgamestate');
const GameRegistry = require('./gameregistry');

/**
 * People are joining and leaving the game in this state.
 * The host has access to a Start and Cancel button which does both respectively
 */
class JoinGameState extends GameState {
    parseStartMessage(){
        let message = `Welcome to the Secret Hitler game!\nTo join the game, press the buttons below to join or leave the game.\nThe host is: ${this.parseUserName(this.game.host)}.\n(S)he can interact with the Start and Cancel button.\n\nCurrent Players:`;
        let players = this.game.players;
        for(let i in players)
            message += `\n${this.parseUserName(players[i])}`;
            return message;
    }
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        this.joinPlayer(game.host);
        this.sendMessageToGroup({
            message: this.parseStartMessage(),
            keyboard:  this.getStartMessageKeyboard(),
            callback: msg => this.start_message = msg.result.message_id
        });
    }
    
    updateStartMessage(){
        let keyboard = this.getStartMessageKeyboard();
        if(this.game.testMode)
            [, ...keyboard] = keyboard;
        this.editGroupMessage(this.start_message, this.parseStartMessage(), {keyboard});
    }
    
    getStartMessageKeyboard(){
        return [
            [this.getButton('Join', 'join'), this.getButton('Leave', 'leave')],
            [this.getButton('Start game', 'start')],
            [this.getButton('Cancel', 'cancel')]
        ];
    }
    /**
     * @param {string} name 
     * @param {string[]} params
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        switch(name){
            case 'join':
                let joinErr =  this.joinPlayer(msg.from);
                if(!joinErr)
                    this.updateStartMessage();
                return joinErr|| 'You joined the game!';
            case 'leave':
                let leaveErr = this.leavePlayer(msg.from);
                if(!leaveErr)
                    this.updateStartMessage();
                return leaveErr || 'You left the game';
            case 'cancel':
                return this.onCancelButton(msg.from);
            case 'start':
                return this.onStartButton(msg.from);
        }
    }
    onCancelButton(player){
        if(player.id != this.game.host.id)
            return 'Only the host can cancel the game';
        GameRegistry.removeGame(this.game.chatId);
        this.editGroupMessage(this.start_message, 'The Secret Hitler game was cancelled by the host.');
        return 'Game cancelled';
    }
    onStartButton(player){
        if(player.id != this.game.host.id)
            return 'Only the host can start the game';
        if(this.game.playerCount < 5)
            return 'There are a minimal of 5 players required to start the game';
        if(this.game.playerCount > 10)
            return 'There are a maximum of 10 players allowed in a game';
        let msg = 'The game has started with the following players:';
        for(let i in this.players){
            msg += `\n${this.parseUserName(this.players[i])}`;
        }
        this.editGroupMessage(this.start_message, msg);
        this.game.setState(new StartGameState());
        return 'The game has started';
    }
    /**
     * @param {*} player 
     * @returns {string|void}
     */
    joinPlayer(player){
        let players = this.game.players;
        if(players[player.id])
            return 'The player is already in the game!';
        players[player.id] = player;
        console.log('joining player', this.parseUserName(player));
        this.game.playerCount++;
    }
    /**
     * @param {*} player 
     * @returns {string|void}
     */
    leavePlayer(player){
        if(player.id == this.game.host.id)
            return 'The host can\'t leave the game!';
        if(!this.game.players[player.id])
            return 'The player is not in the game!';
        delete this.game.players[player.id];
        this.game.playerCount--;
    }
    enableTestMode(count){
        let game = this.game;
        game.testMode = true;
        game.players = {};
        game.playerCount = 0;
        this.joinPlayer(game.host);
        for(let i = 1; i < count; i++){
            let newObj = {
                id: `TEST${i}`,
                first_name: 'Test Person',
                last_name: i
            };
            this.joinPlayer(newObj);
        }
        this.updateStartMessage();
    }
}
module.exports = JoinGameState;