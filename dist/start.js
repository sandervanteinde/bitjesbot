"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./utils/server");
const config_1 = require("./utils/config");
const loop_1 = require("./utils/loop");
const telegram_bot_1 = require("./telegram/telegram-bot");
const roll_command_1 = require("./telegram/commands/roll.command");
const anwb_command_1 = require("./telegram/commands/anwb.command");
const iska_command_1 = require("./telegram/commands/iska.command");
const pickupline_command_1 = require("./telegram/commands/pickupline.command");
const momenttz = require("moment-timezone");
const reminder_command_1 = require("./telegram/commands/reminder.command");
const weather_command_1 = require("./telegram/commands/weather.command");
let telegram = new telegram_bot_1.TelegramBot();
telegram.registerBotCommand(new roll_command_1.RollCommand());
telegram.registerBotCommand(new anwb_command_1.AnwbCommand());
telegram.registerBotCommand(new pickupline_command_1.PickupLineCommand());
telegram.registerBotCommand(new reminder_command_1.ReminderCommand(telegram));
telegram.registerBotCommand(new weather_command_1.WeatherCommand());
if (config_1.default.domain) {
    let server = new server_1.Server();
    server.startWithOptions(config_1.default, () => {
        telegram.start(server);
        telegram.registerBotCommand(new iska_command_1.IskaCommand(server, telegram));
    });
}
else {
    telegram.start();
}
momenttz.tz.setDefault('Europe/Amsterdam');
loop_1.default.run();
//# sourceMappingURL=start.js.map