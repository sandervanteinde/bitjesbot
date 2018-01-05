
let open = false;
/**
 * @param {string} id 
 * @param {any} content 
 * @param {function(any):void} callback
 */
let sendMessage = (id, content, callback) => {};
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
    let replyId = 1;
    let replies = {};
    onWebSocket = (func) => {
        callbacks.push(func);
    }
    let ws = new WebSocket(`ws${window.location.protocol == 'https:' && 's' || ''}://${window.location.hostname}:8000`);
    /**
     * @type {Object.<string,Function[]>}
     */
    let handlers = {
        '*': []
    };
    ws.onopen = () => {
        open = true;
        callbacks.forEach(func => func());
        onWebSocket = (func) => func();
        delete callbacks;
    }
    sendMessage = (id, content, callback) => {
        if(!open)
            callbacks.push(() => sendMessage(id, content, callback));
        else{
            let obj = {id, content, key};
            if(callback){
                obj.replyId = replyId++;
                replies[obj.replyId] = callback;
                setTimeout(() => { //handle timeouts?
                    if(!replies[obj.replyId]) return;
                    replies[obj.replyId](false);
                    delete replies[obj.replyId];
                }, 10000);
            }
            ws.send(JSON.stringify(obj));
        }
    };
    addHandler = (id, handler) => {
        if(handlers[id])
            handlers[id].push(handler)
        else
            handlers[id] = [handler];
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
            for(let func of handler)
                func(obj.content);
        for(let joker of handlers['*'])
            joker(obj.id, obj.content);
    }
    
        
    let match = document.cookie.match(/key=([0-9a-z]+)/);
    if(match)
        key = match[1];
        
    onWebSocket(() => {
        addHandler('telegramKey', requestTelegramLinkResponse);
        addHandler('_reply', obj => {
            let replyId = obj.replyId;
            let callback = replies[replyId];
            if(callback)
                callback(obj.result);
            delete replies[replyId];
        });
    });
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
$(() => {
    botName = $("meta[name=botname]").attr('content');
});

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}