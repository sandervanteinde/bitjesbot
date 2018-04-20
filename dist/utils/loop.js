"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LoopHandler {
    constructor() {
        this.subscriptions = [];
        this.running = false;
    }
    run(interval = 500) {
        if (this.running)
            return;
        this.running = true;
        this.intervalId = setInterval(() => {
            let subscriptions = this.subscriptions;
            for (let i = 0; i < subscriptions.length; i++) {
                try {
                    subscriptions[i]();
                }
                catch (err) {
                    console.error('Error in loop!');
                    console.error(err);
                }
            }
        }, interval);
    }
    stop() {
        if (!this.running)
            return;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    subscribe(func) {
        return this.subscriptions.push(func) - 1;
    }
}
exports.default = new LoopHandler();
//# sourceMappingURL=loop.js.map