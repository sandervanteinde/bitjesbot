let addChatMessage;
let disableChat;
let enableChat;
(() => {
    let name = '';
    let chatContainer = document.querySelector('#chat tbody');
    let input = $('#chat-text');
    let joinBtn = document.querySelector('#joinbutton');
    joinBtn.onclick = () => {
        let func = () => {
            sendMessage('sh_request_join', {name, gameId: game.chatId}, reply => {
                if(reply){
                    Materialize.toast(reply, 10000);
                    name = '';
                }
            });
        };
        if(!name)
            new UsernameDialog(username => { 
                name = username;
                func();
            }).create();
        else
            func();

    };

    input.keyup(e => {
        if(e.keyCode != 13) return;//if not enter, ignore it
        let val = input.val();
        if(!val) return;
        input.val('');
        if(!name){
            new UsernameDialog(username => {
                if(!username) return;
                name = username;                
                sendMessage('sh_web_message', {from: username, message: val, game: game.chatId});
            }).create();
        }else{
            sendMessage('sh_web_message', {from: name, message: val, game: game.chatId});
        }
    });

    function appendRow(firstTd, secondTd){
        let row = document.createElement('tr');
        let atBottom = chatContainer.scrollHeight < (chatContainer.clientHeight + chatContainer.scrollTop + 1)
        let userName = document.createElement('td');
        userName.innerHTML = firstTd;
        row.appendChild(userName);
        if(secondTd){
            let messageTd = document.createElement('td');
            messageTd.innerHTML = secondTd;
            row.appendChild(messageTd);
        }
        else
            userName.setAttribute('colspan', 2);
        chatContainer.appendChild(row);
        if(atBottom)
            chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
    }
    /**
     * @param {TelegramMessage} message 
     */
    addChatMessage = (message) => appendRow(playerName(message.from), message.text.replace(/\n/g, '<br>'));
    enableChat = () => {
        while(chatContainer.children.length > 0)
            chatContainer.children[0].remove();
        chatContainer.classList.remove('disabled');
    };
    disableChat = () => {
        chatContainer.classList.add('disabled');
        while(chatContainer.children.length > 0)
            chatContainer.children[0].remove();
        appendRow('The chat is disabled for this session. Contact the host to have it changed');
    };
    onWebSocket(() => {
        addHandler('sh_player_joined', player => {
            if(player.id == name){
                joinBtn.remove();
                setLocalPlayer(player);
            }
        });
    });
})();