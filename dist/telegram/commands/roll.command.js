"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RollCommand {
    constructor() {
        this.dndStyleRoll = /(\d+)d(\d+)/i;
    }
    getSlashCommands() {
        return 'roll';
    }
    getHelpMessageText() {
        return 'Rolls a dice';
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        let param = context.args.length >= 1 ? context.args[0] : '6';
        let matches = param.match(this.dndStyleRoll);
        if (matches)
            this.handleDndRoll(context, output, matches);
        else {
            let num = Number(param);
            if (!num)
                output.sendToChat('Invalid parsed /roll', { reply: true });
            else {
                let roll = Math.round(Math.random() * num + 0.5);
                output.sendToChat(`Roll a ${param}-sized dice:\nRolled: ${roll}`, { reply: true });
            }
        }
    }
    handleDndRoll(context, output, match) {
        let amountOfDice = Number(match[1]);
        let diceSize = Number(match[2]);
        let returnMessage;
        let totalRoll = 0;
        if (amountOfDice > 10000) {
            output.sendToChat('The maximum amount of dice are 10.000.', { reply: true });
            return;
        }
        if (diceSize > 10000) {
            output.sendToChat('The maximum dice size is 10.000.', { reply: true });
            return;
        }
        if (amountOfDice > 20) {
            for (let i = 0; i < amountOfDice; i++) {
                let roll = Math.round(Math.random() * diceSize + 0.5);
                totalRoll += roll;
            }
            returnMessage = `Total roll: ${totalRoll}`;
        }
        else {
            returnMessage = '';
            for (let i = 0; i < amountOfDice; i++) {
                let roll = Math.round(Math.random() * diceSize + 0.5);
                totalRoll += roll;
                returnMessage = `${returnMessage}${i == 0 ? '' : '\n'}Roll ${i + 1}: ${roll}`;
            }
            returnMessage = `${returnMessage}\n\nTotal roll: ${totalRoll}`;
        }
        output.sendToChat(returnMessage, { reply: true });
    }
}
exports.RollCommand = RollCommand;
//# sourceMappingURL=roll.command.js.map