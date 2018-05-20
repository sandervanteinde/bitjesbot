import { Server } from "./utils/server";
import config from "./utils/config";
import { readFile } from "fs";
import loop from './utils/loop';
import { TelegramBot } from "./telegram/telegram-bot";
import { RollCommand } from "./telegram/commands/roll.command";
import { AnwbCommand } from "./telegram/commands/anwb.command";
import { IskaCommand } from "./telegram/commands/iska.command";
import { PickupLineCommand } from "./telegram/commands/pickupline.command";
import * as momenttz from 'moment-timezone';
import { ReminderCommand } from "./telegram/commands/reminder.command";
import { WeatherCommand } from "./telegram/commands/weather.command";
import { TriviaCommand } from "./telegram/commands/trivia.command";
import { PollCommand } from "./telegram/commands/poll.command";


let telegram = new TelegramBot();
telegram.registerBotCommand(new RollCommand());
telegram.registerBotCommand(new AnwbCommand());
telegram.registerBotCommand(new PickupLineCommand());
telegram.registerBotCommand(new ReminderCommand(telegram));
telegram.registerBotCommand(new WeatherCommand());
telegram.registerBotCommand(new TriviaCommand(telegram));
telegram.registerBotCommand(new PollCommand(telegram));
if(config.domain){
    let server = new Server();
    server.startWithOptions(config, () => {
        telegram.start(server);
        telegram.registerBotCommand(new IskaCommand(server, telegram));
    });
}else{
    telegram.start();
}
momenttz.tz.setDefault('Europe/Amsterdam');
loop.run();