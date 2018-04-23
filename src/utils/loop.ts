type LoopCallbackFunc = () => void;
class LoopHandler{
    private subscriptions : LoopCallbackFunc[] = [];
    private running : boolean = false;
    private intervalId: NodeJS.Timer | undefined;
    constructor(){}
    run(interval : number = 500){
        if(this.running) return;
        this.running = true;
        this.intervalId = setInterval(() => {
            let subscriptions = this.subscriptions;
            for(let i = 0; i < subscriptions.length; i++){
                try{
                    subscriptions[i]();
                }catch(err){
                    console.error('Error in loop!');
                    console.error(err);
                }

            }
        }, interval);
    }
    stop(){
        if(!this.running) return;
        if(this.intervalId){
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    subscribe(func : LoopCallbackFunc){
        return this.subscriptions.push(func) - 1;
    }
}
export default new LoopHandler();