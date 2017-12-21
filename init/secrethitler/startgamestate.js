const SecretHitlerGame = require('./secrethitlergame');
const GameState = require('./gamestate');
const bot = require('../bot');
const roles = require('./roles');
const arrayUtil = require('../../utils/arrayutil');
class StartGameState extends GameState{
    constructor(){
        super();
    }
    /**
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        bot.sendMessage({chatId: game.chatId, message: 'Dividing the roles! You will be receiving a private message with your role!'});
        let copy = Array.from(roles);
        copy.splice(game.playerCount, 10 - game.playerCount);
        arrayUtil.shuffle(copy);
        let roleId = 0;
        for(let i in game.players)
            game.setPlayerRole(i, copy[roleId++]);
        this.announceRoles();
    }
    announceRoles(){
        let game = this.game;
        this.announceFascist(Array.from(game.fascists()));
        this.announceLiberals(Array.from(game.liberals()));
    }
    /**
     * 
     * @param {any[]} fascists 
     */
    announceFascist(fascists){
        let hitlerIndex = fascists.findIndex((c => c.role.isHitler));
        let [hitler] = fascists.splice(hitlerIndex, 1);
        console.log({
            fascists,hitler
        });
    }
    announceLiberals(liberals){

    }
    announceToPlayer(playerId, msg){

    }

}
module.exports = StartGameState;