"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./utils/server");
const config_1 = require("./utils/config");
const loop_1 = require("./utils/loop");
const telegram_bot_1 = require("./telegram/telegram-bot");
const roll_command_1 = require("./telegram/commands/roll.command");
let telegram = new telegram_bot_1.TelegramBot();
telegram.registerBotCommand(new roll_command_1.RollCommand());
if (config_1.default.domain) {
    let server = new server_1.Server();
    server.startWithOptions(config_1.default, () => {
        telegram.start(server);
    });
}
else {
    telegram.start();
}
loop_1.default.run();
//# sourceMappingURL=start.js.map