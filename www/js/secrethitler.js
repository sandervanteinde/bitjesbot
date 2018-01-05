/**
 * @type {SecretHitlerGame}
 */
let game;

let joinBtn = document.querySelector('#joinbutton');
let gameId = getParameterByName('gameid');

onWebSocket(() => {
    sendMessage('secret-hitler', gameId);
    addHandler('sh_init_state', obj => {
        game = obj;
        for(let player in game.players)
            addPlayerToTable(game.players[player], game.host.id == player && 'Host' || 'Joined');
        if(!obj.allowWebChat)
            disableChat();
    });
    addHandler('sh_player_joined', obj => {
        Materialize.toast(playerName(obj) + ' has joined!', 4000);
        game.players[obj.id] = obj;
        game.playerCount++;
        addPlayerToTable(obj, 'Joined');
    });
    addHandler('sh_player_left', obj => {
        Materialize.toast(playerName(obj) + ' has left!', 4000);
        delete game.players[obj.id];
        removePlayerFromTable(obj);
    });
    addHandler('sh_message', addChatMessage);
    addHandler('sh_start_game', newGame => game = newGame);
    addHandler('sh_state_changed', states => game.state = states.new);
    addHandler('sh_new_president', seat => game.president = seat);
    addHandler('sh_new_chancellor', seat => game.chancellor = seat);
    addHandler('sh_new_previous_president', seat => game.previousPresident = seat);
    addHandler('sh_new_previous_chancellor', seat => game.previousChancellor = seat);
    addHandler('sh_draw_deck_reshuffled', seat => {
        game.drawDeck += game.discardDeck;
        game.discardDeck = 0;
    });
    addHandler('sh_president_draw_policy', () => game.drawDeck -= 3);
    addHandler('sh_president_discard_card', () => game.discardDeck++);
    addHandler('sh_chancellor_plays_card', card => {
        game.discardDeck++;
        if(card.faction == 'Liberal')
            game.liberalCardsPlayed++;
        else
            game.fascistsCardsPlayed++;
    });
});
