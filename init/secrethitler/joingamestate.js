const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const StartGameState = require('./startgamestate');
const GameRegistry = require('./gameregistry');
const Player = require('./player');
const config = require('../../config');
const TelegramMessageHandler = require('./privateMessageHandlers/telegramMessageHandler');
const TestPersonMessageHandler = require('./privateMessageHandlers/testPersonMessageHandler');

/**
 * People are joining and leaving the game in this state.
 * The host has access to a Start and Cancel button which does both respectively
 */
class JoinGameState extends GameState {
    parseStartMessage(){
        let message = `Welcome to the Secret Hitler game!\nTo join the game, press the buttons below to join or leave the game.\nThe host is: ${this.parseUserName(this.game.host)}.\n(S)he can interact with the Start and Cancel button.\n\nYou can also invite people to play over the web:\nhttps://${config.domain  || `localhost:${config.webPort}`}/secrethitler?gameid=${this.game.chatId}\n\nCurrent Players:`;
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
        if(game.playerCount == 0) //new game
            this.joinPlayer(game.host, new TelegramMessageHandler(game.host.id));
        this.sendMessageToGroup({
            message: this.parseStartMessage(),
            keyboard:  this.getStartMessageKeyboard(),
            callback: msg => this.start_message = msg.result.message_id
        });
        this.on('player_joined', () => this.updateStartMessage());
        this.on('player_left', () => this.updateStartMessage());
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
                return this.joinPlayer(msg.from, new TelegramMessageHandler(msg.from.id))|| 'You joined the game!';
            case 'leave':
                return this.leavePlayer(msg.from) || 'You left the game';
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
    joinPlayer(player, messageHandler){
        let players = this.game.players;
        if(players[player.id])
            return 'The player is already in the game!';
        players[player.id] = new Player(messageHandler, player);
        console.log('joining player', this.parseUserName(player));
        this.game.playerCount++;
        this.emitEvent('player_joined', players[player.id].toJSON());
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
        this.emitEvent('player_left', player);
    }
    enableTestMode(count){
        let game = this.game;
        game.testMode = true;
        let i = 0;
        while(game.playerCount < count){
            let newObj;
            let handler;
            do{
                i++;
                newObj = {
                    id: `TEST${i}`,
                    first_name: 'Test Person',
                    last_name: i
                };
                handler = new TestPersonMessageHandler(newObj.id);
            }while(this.joinPlayer(newObj, handler));
        }
        while(game.playerCount > count && game.playerCount > 1){
            let j = 0
            for(j = game.playerCount; j >= 0; j--){
                let playerName = `TEST${j}`;
                let player = game.players[playerName];
                if(!player) continue;
                this.leavePlayer(player);
                i++;
                break;
            }
            if(j == -1) //couldn't leave more people, all testers are gone
                break;
        }
    }
    sendStatus(){
        this.sendMessageToGroup({message: 'The game has not started yet!'});
    }
}
module.exports = JoinGameState;