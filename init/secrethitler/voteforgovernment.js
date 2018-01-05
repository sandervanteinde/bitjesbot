const GameState = require('./gamestate');
const SecretHitlerGame = require('./secrethitlergame');
const LegislativeStatePresident = require('./legislativestatepresident');
const WinState = require('./winstate');
const Faction = require('./faction');
/**
 * The state where all alive members are voting for the currently elected President and Chancellor
 */
class VoteForGovernment extends GameState{
    constructor(){
        super();
        /**
         * The votes, null is not voted, true/false is voted yes/no
         * @type {Object.<number, boolean>}
         */
        this.votes = {};

        /**
         * @type {any[]}
         */
        this.balotKeyboard = undefined;
    }
    /**
     * 
     * @param {SecretHitlerGame} game 
     */
    onStartState(game){
        super.onStartState(game);
        this.president = this.parseUserName(this.getPlayerBySeat(game.president));
        this.chancellor = this.parseUserName(this.getPlayerBySeat(game.chancellor));
        for(let player of game.alive()){
            this.votes[player.id] = null;
        }
        this.sendMessageToGroup({
            message: this.parseVoteMessage(),
            keyboard: this.getKeyboard(),
            callback: msg => this.message = msg.result.message_id
        });
    }
    /**
     * @returns {string}
     */
    parseVoteMessage(){
        let msg = `Please vote for the following government:\nPresident: ${this.president}\nChancellor: ${this.chancellor}\nPeople that still need to vote:`;
        for(let id in this.votes){
            if(this.votes[id] !== null) continue; //has voted
            let player = this.game.players[id];
            msg += `\n- ${this.parseUserName(player)}`;
        }
        return msg;
    }
    getKeyboard(){
        if(!this.balotKeyboard)
            this.balotKeyboard = [
                [this.getButton('Ja!', 'vote', 'yes'), this.getButton('Nein!', 'vote', 'no')]
            ];
        return this.balotKeyboard;
    }
    /**
     * @param {SecretHitlerGame} game 
     * @param {TelegramCallbackQuery} msg 
     * @param {string} name 
     * @param {string[]} params 
     * @returns {string|void}
     */
    handleInput(game, msg, name, ...params){
        if(name != 'vote')
            return super.handleInput(game, msg, name, ...params);
        let [vote] = params;
        let id = msg.from.id;
        if(this.votes[id] === undefined)
            return 'You are not alive or part of the game. You can\'t vote!';
        let firstVote = this.votes[id] === null;
        this.votes[id] = Boolean(vote == 'yes');
        this.emitEvent('player_voted', id);
        let allVoted = this.checkAllVoted();
        if(firstVote){
            if(this.message && !allVoted) //if this is undefined, we're already out of this state, prevent editing
                this.editGroupMessage(this.message, this.parseVoteMessage(), {keyboard: this.getKeyboard()});
            return `You voted: ${vote == 'yes' && 'Ja!' || 'Nein!'}`;
        }
        else
            return `You changed your vote to ${vote == 'yes' && 'Ja!' || 'Nein!'}`;
    }
    checkAllVoted(){
        let votes = this.votes;
        let yesCount = 0;
        let noCount = 0;
        let voteMessage = '';
        for(let playerId in votes){
            let vote = votes[playerId];
            if(vote === null)
                return false; //someone has not voted!
            if(vote) 
                yesCount++;
            else
                noCount++;
                voteMessage += `\n${this.parseUserName(this.game.players[playerId])}: ${vote && 'Ja!' || 'Nein!'}`;
        }
        let elected = yesCount > noCount;
        voteMessage = `The votes are in!${voteMessage}\n\nTotal Ja! votes: ${yesCount}\nTotal Nein! votes: ${noCount}\n\nThe government is ${!elected && 'NOT ' || ''}elected`;
        this.editGroupMessage(this.message, this.parseVoteMessage()); //remove keyboard
        this.message = undefined;
        this.sendMessageToGroup({message: voteMessage});
        if(!elected)
            this.incrementElectionTracker();
        else{
            this.game.electionTracker = 0; //reset! NO MORE ANARCHY!
            let chancellor = this.getPlayerBySeat(this.game.chancellor);
            if(this.game.fascistsCardsPlayed >= 3){
                if(chancellor.role.isHitler)
                    this.game.setState(new WinState(Faction.Fascist, 'Hitler is Chancellor!'));
                else{
                    chancellor.confirmedNotHitler = true;
                    this.game.setState(new LegislativeStatePresident());
                }
            }
            else
                this.game.setState(new LegislativeStatePresident());
        }
        this.emitEvent('vote_result', {yes: yesCount, no: noCount, votes});
        return true;
    }
}
module.exports = VoteForGovernment;