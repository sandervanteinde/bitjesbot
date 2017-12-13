let subscriptions = [];
let running = false;
let intervalId;

function run(interval = 500){
    if(running)
        return;
    running = true;
    intervalId = setInterval(() => {
        for(let i = 0; i < subscriptions.length; i++)
            subscriptions[i]();
    }, interval);
}
function stop(){
    if(!running)
        return;
    clearInterval(intervalId);
}
 /** 
 * @param {function} callbackFn 
 * @returns {number} the ID of the callback
 */
function subscribe(callbackFn){
    return subscriptions.push(callbackFn) - 1;
}
module.exports = {
    run,
    subscribe,
    stop
}