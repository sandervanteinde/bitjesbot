
let open = false;
/**
 * @param {string} id 
 * @param {any} content 
 */
let sendMessage = (id, content) => {};
/**
 * @param {string} id 
 * @param {function(any):void} handler 
 */
let addHandler = (id, handler) => {};
/**
 * @param {function():void} func 
 */
let onWebSocket = (func) => {};
/**
 * @type {string}
 */
let botName;
(() => {
    let key;
    /**
     * @type {function[]}
     */
    let callbacks = [];
    onWebSocket = (func) => {
        callbacks.push(func);
    }
    let ws = new WebSocket(`ws${window.location.protocol == 'https:' && 's' || ''}://${window.location.hostname}:8000`);
    /**
     * @type {Object.<string,Function>}
     */
    let handlers = {};
    ws.onopen = () => {
        open = true;
        callbacks.forEach(func => func());
        onWebSocket = (func) => func();
        delete callbacks;
        sendMessage('hello');
    }
    sendMessage = (id, content) => {
        ws.send(JSON.stringify({id, content, key}));
    };
    addHandler = (id, handler) => {
        handlers[id] = handler;
    }
    ws.onmessage = msg => {
        let obj = JSON.parse(msg.data);
        let handler = handlers[obj.id];
        if(obj.id == 'telegramlink'){
            key = obj.content;
            document.cookie = `key=${key}`;
            location.reload();
            return;
        }
        if(handler)
            handler(obj.content);
        else
            console.error('websocket message received with unknown handler');
    }
    
        
    let match = document.cookie.match(/key=([0-9a-z]+)/);
    if(match)
        key = match[1];
})();

function requestTelegramLink(){
    sendMessage('requestTelegramKey');
}
function removeTelegramLink(){
    sendMessage('removeTelegramKey');
}
function requestTelegramLinkResponse(key){
    let modal;
    let cancelRequest = () => {
        modal.modal('close'); 
        modal.remove();
        sendMessage('cancelTelegramKey', key);
    }
    modal = $("<div>").addClass('modal').append(
        $("<div>").addClass('modal-content').append(
            $("<h4>").html('Link telegram'),
            $("<p>").html("To link telegram to the website. Click the button below. This will open telegram chat. In the chat press start to couple your telegram client to your browser"),
            $("<a>").addClass('btn').attr({href: `https://t.me/${botName}?start=` + key, target: '_blank'}).html('Link telegram'),
            $("<button>").html('cancel').addClass('btn red').on('click', cancelRequest)
        )
    );
    $(document.body).append(modal);
    modal.modal();
    modal.modal('open');
}
onWebSocket(() => {
    addHandler('telegramKey', requestTelegramLinkResponse);
});
$(() => {
    botName = $("meta[name=botname]").attr('content');
});