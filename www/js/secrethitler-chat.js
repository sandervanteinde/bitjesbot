let addChatMessage;
let disableChat;
let enableChat;
(() => {
    let name = '';
    /**
     * @type {HTMLElement}
     */
    let tab = document.querySelector('.tab[target=chat]');
    let chatContainer = document.querySelector('#chat tbody');
    let input = $('#chat-text');
    let joinBtn = document.querySelector('#joinbutton');
    /**
     * @type {HTMLInputElement}
     */
    let systemMessage = document.querySelector('#system_message');
    systemMessage.onchange = () => {
        if(chatContainer.classList.contains('hide-system'))
            chatContainer.classList.remove('hide-system');
        else
            chatContainer.classList.add('hide-system');
    };
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
    function enableFlash(){
        if(tab.classList.contains('active')) return;
        let callback = tab.onclick;
        let interval;
        let on = false;
        tab.onclick = ev => {
            tab.onclick = callback;
            clearInterval(interval);
            callback(ev);
            tab.style.removeProperty('background');
        };
        interval = setInterval(() => {
            on = !on;
            if(on)
                tab.style.background = 'yellow';
            else
                tab.style.removeProperty('background');
        }, 500);
        tab.flashing = true;
    }
    function appendRow(firstTd, secondTd, className = undefined){
        let row = document.createElement('tr');
        if(className)
            row.classList.add(className);
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
        if(!tab.flashing && getComputedStyle(row).display != 'none')
            enableFlash();
    }
    /**
     * @param {TelegramMessage} message 
     */
    addChatMessage = (message) => appendRow(playerName(message.from), message.text.replace(/\n/g, '<br>'));
    function addSystemMessage(message){
        appendRow(message.replace(/\n/g, '<br>'), undefined, 'system');
    }
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
        
        addHandler('sh_message', addChatMessage);
        addHandler('sh_system_message', addSystemMessage);
    });
})();