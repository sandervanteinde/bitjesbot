const GameState = require('../gamestate');
const PresidentPickChancellorState = require('../presidentpickchancellorstate');
const Player = require('../player');
class PresidentAction extends GameState{
    constructor(){
        super();
        if(this.constructor == PresidentAction)
            throw 'You can\'t construct the abstract class PresidentAction';
    }
    onStartState(game){
        super.onStartState(game);
        let president = this.getPlayerBySeat(this.game.president);
        this.president = president;
        this.sendMessageToGroup({message: this.getAnnouncementMessage(this.parseUserName(president))});
    }
    getDescription(){
        throw `${this.constructor.name} did not implement the getDescription function`;
    }
    /**
     * @param {string} playerName
     * @returns {string}
     */
    getAnnouncementMessage(playerName){
        throw `${this.constructor.name} did not implement the getAnnouncementMessage function`;
    }
    switchToNextPresidentState(){
        let presidentId = this.game.getNextPresident();
        this.game.setState(new PresidentPickChancellorState(presidentId));
    }
    /**
     * @param {Player[]} players
     * @param {string} callbackName
     * @param {function(Player,number):string} buttonName
     * @returns {any[][]}
     */
    getKeyboardForPlayers(players, callbackName, buttonName){
        let keyboard = [];
        let row = [];
        for(let i = 0; i < players.length; i++){
            let player = players[i];
            row.push(this.getButton(buttonName(player, i), callbackName, i));
            if(row.length == 2)
            {
                keyboard.push(row);
                row = [];
            }
        }
        if(row.length > 0)
            keyboard.push(row);
        return keyboard;
    }
}
module.exports = PresidentAction;