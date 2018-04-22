"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const bodyparser_1 = require("../../utils/bodyparser");
class AnwbCommand {
    get roadRegex() { return /([AN]\d+)/gi; }
    ;
    getSlashCommands() {
        return 'anwb';
    }
    getHelpMessageText() {
        return 'Dutch traffic information services';
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        if (!context.hasArguments) {
            output.sendToChat('Welke weg wil je de files van weten?', {
                reply: true,
                forceReply: (replyContext, replyOutput) => this.sendAnwbReply(replyContext.message.text.split(' '), replyOutput)
            });
        }
        else {
            this.sendAnwbReply(context.args, output);
        }
    }
    sendAnwbReply(roads, output) {
        let matches = [];
        for (let road of roads) {
            let match = road.match(this.roadRegex);
            if (match) {
                let [matchedRoad] = match;
                matchedRoad = matchedRoad.toUpperCase();
                if (matches.indexOf(matchedRoad) == -1)
                    matches.push(matchedRoad);
            }
        }
        if (matches.length == 0) {
            output.sendToChat('Er is geen valide weg opgegeven.\nValide wegen zijn A of N wegen, gevolgd door het nummer.', {
                reply: true
            });
            return;
        }
        else if (matches.length > 5) {
            output.sendToChat('Het maximum aantal wegen dat je kan selecteren is 5', {
                reply: true
            });
            return;
        }
        this.doApiCall((entries) => {
            let msg = '';
            for (let road of matches) {
                let entry = entries[road];
                if (!entry || entry.events.trafficJams.length == 0) {
                    msg += `Er zijn geen files op de ${road}\n\n`;
                }
                else {
                    let jams = entry.events.trafficJams;
                    msg += `Er ${jams.length == 1 ? 'is' : 'zijn'} *${jams.length}* file${jams.length > 1 ? 's' : ''} gemeld op de ${road}`;
                    for (let i = 0; i < jams.length; i++) {
                        let jam = jams[i];
                        msg += `\n\n- Van *${jam.from}* naar *${jam.to}* (*${Math.round(jam.distance / 1000)} KM* / *${Math.round(jam.delay / 60)} min.* vertraging)\n${jam.description}`;
                    }
                    msg += '\n\n';
                }
            }
            output.sendToChat(msg, {
                reply: true,
                parse_mode: 'Markdown'
            });
        });
    }
    /**
     *
     * @param {function(Object<string,AnwbRoadEntry>):void} callback
     */
    doApiCall(callback) {
        if (this.cache == null) {
            https_1.get('https://www.anwb.nl/feeds/gethf', res => bodyparser_1.default.parseJson(res, (anwbResult) => {
                let cache = {};
                for (let entry of anwbResult.roadEntries) {
                    cache[entry.road] = entry;
                }
                callback(cache);
                this.cache = cache;
                setTimeout(() => this.cache = undefined, 60000);
            }));
        }
        else
            callback(this.cache);
    }
}
exports.AnwbCommand = AnwbCommand;
//# sourceMappingURL=anwb.command.js.map