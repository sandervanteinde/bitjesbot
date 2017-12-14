class LoopHandler{
    constructor(){
        /**
         * @type Array<function>
         */
        this.subscriptions = [];
        this.running = false;
        /**
         * @type number
         */
        this.intervalId;
    }
    run(interval = 500){
        if(this.running)
            return;
        this.running = true;
        this.intervalId = setInterval(() => {
            let subscriptions = this.subscriptions;
            for(let i = 0; i < subscriptions.length; i++)
                subscriptions[i]();
        }, interval);
    }
    stop(){
        if(!running)
            return;
        clearInterval(intervalId);
    }
    /** 
     * @param {function():void} callbackFn 
     * @returns {number} the ID of the callback
     */
    subscribe(callbackFn){
        return this.subscriptions.push(callbackFn) - 1;
    }
}
module.exports = new LoopHandler();