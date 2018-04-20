import { Server } from "./utils/server";
import config from "./utils/config";
import { readFile } from "fs";
import loop from './utils/loop';
import { TelegramBot } from "./telegram/telegram-bot";
import { RollCommand } from "./telegram/commands/roll.command";

let telegram = new TelegramBot();
telegram.registerBotCommand(new RollCommand());

if(config.domain){
    let server = new Server();
    server.startWithOptions(config, () => {
        telegram.start(server);
    });
}else{
    telegram.start();
}

loop.run();