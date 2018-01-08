
let playerTable = document.querySelector('#players tbody');
let players = [];
function playerName(player){
    if(player.username)
        return `@${player.username}`;
    let name = player.first_name;
    if(player.last_name)
        name += ' ' + player.last_name;
    return name;
}
/**
 * @param {TelegramUser} player 
 */
function addPlayerToTable(player, status = ''){
    let tr = document.createElement('tr');
    let nameTd = document.createElement('td');
    if(player.username){
        let a = document.createElement('a');
        a.setAttribute('href', `tg://resolve?domain=${player.username}`);
        nameTd.appendChild(a);
        a.innerHTML = `@${player.username}`;
    }
    else{
        let name = player.first_name;
        if(player.last_name)
            name += ' ' + player.last_name;
        nameTd.innerHTML = name;
    }
    let statusTd = document.createElement('td');
    statusTd.innerHTML = status;
    
    tr.user = player;

    tr.appendChild(nameTd);
    tr.appendChild(statusTd);
    
    playerTable.appendChild(tr);
    players.push({tr, player});
}
function removePlayerFromTable(player){
    for(let i = 0; i < players.length; i++){
        if(players[i].player.id == player.id){
            playerTable.removeChild(players[i].tr);
            players.splice(i, 1);
            return;
        }
    }
}