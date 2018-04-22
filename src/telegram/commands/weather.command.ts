import { get } from "https";
import bodyparser from "../../utils/bodyparser";
import config from "../../utils/config";
import { Database } from "../../utils/db";
import { IBotCommand } from "../bot-helpers";
import { TelegramOutput } from "../outputs/telegram-output";
import { TelegramMessageContext } from "../telegram-message-context";
type Location = { lat: number, lng: number };
type GoogleMapsResult = {
    results: {
        geometry: {
            location: Location
        },
        formatted_address: string
    }[]
}
type DarkskyForecast = {
    currently: {
        summary: string,
        temperature: number
    }
}
class WeatherDbEntry {
    constructor(
        public user: number,
        public location: Location,
        public description: string
    ) { }

}
const LOCATION_COMMAND = 'location';
export class WeatherCommand implements IBotCommand {
    private mapLocations: { [key: number]: WeatherDbEntry } = {};
    private database: Database<WeatherDbEntry> = new Database<WeatherDbEntry>('weather');
    constructor() {
        this.database.load(() => {
            for (let entry of this.database)
                this.mapLocations[entry.user] = entry;
        });
    }
    getSlashCommands(): string | string[] {
        return ['weather', LOCATION_COMMAND];
    }
    getHelpMessageText(): string | string[] | null {
        return ['Retrieves weather information', 'Registers your location for weather commands'];
    }
    isGroupOnly(): boolean {
        return false;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput): void {
        if (context.slashCommand == LOCATION_COMMAND)
            this.handleLocationCommand(context, output);
        else
            this.handleWeatherCommand(context, output);
    }
    private handleWeatherCommand(context: TelegramMessageContext, output: TelegramOutput) {
        if (context.hasArguments) {
            let query = context.args.join(' ');
            WeatherCommand.getWeatherVariables(query, (location, description) => {
                if (location && description)
                    WeatherCommand.sendForecast(output, location, description);
                else
                    output.sendToChat('Something went wrong!', { reply: true });
            });
            return;
        }
        let item = this.mapLocations[context.message.from.id];
        if (!item) {
            output.sendToChat(`You haven't registered a location yet. Use /${LOCATION_COMMAND} [Your Location] to register your location.`, { reply: true });
            return;
        }
        let { location, description } = item;
        WeatherCommand.sendForecast(output, location, description);
    }
    private handleLocationCommand(context: TelegramMessageContext, output: TelegramOutput) {
        let citNameArr = context.args;
        if (!citNameArr || citNameArr.length == 0) {
            output.sendToChat('Please reply to this message the place you would like to register as your city.', {
                reply: true,
                forceReply: (msg) => this.processCityNameRequest(msg.message.text, msg.message.from.id, output)
            });
            return;
        }
        let cityName= citNameArr.join(' ');
        this.processCityNameRequest(cityName, context.message.from.id, output);
    }
    private processCityNameRequest(cityName: string, userId: number, output: TelegramOutput){
        WeatherCommand.getWeatherVariables(cityName, (location, description) => {
            if (!location || !description) {
                output.sendToChat(`Invalid format: Usage '/${LOCATION_COMMAND} [Your City Name]'`, { reply: true });
            } else {
                if (this.mapLocations[userId]) {
                    this.mapLocations[userId].location = location;
                } else {
                    let newEntry = new WeatherDbEntry(userId, location, description);
                    this.database.add(newEntry);
                    this.mapLocations[userId] = newEntry;
                }
                this.database.saveChanges();
                output.sendLocation(location, { reply: true });
            }
        });
    }
    static fahrenheitToCelcius(fahrenheit: number): number {
        return Math.round((fahrenheit - 32) / 1.8);
    }
    private static getWeatherVariables(query: string, callback: (location?: Location, description?: string) => void) {
        get(`https://maps.googleapis.com/maps/api/geocode/json?&address=${query}&key=${config.googleMapsKey}`, (res) => bodyparser.parseJson<GoogleMapsResult>(res, body => {
            if (body.results.length == 0) {
                callback();
            } else {
                let location = body.results[0].geometry.location;
                let description = body.results[0].formatted_address;
                callback(location, description);
            }
        }));
    }
    private static sendForecast(output: TelegramOutput, location: Location, description: string) {
        get(`https://api.darksky.net/forecast/${config.weatherSecret}/${location.lat},${location.lng}?exclude=minutely,hourly,daily,alerts,flags`, res => bodyparser.parseJson<DarkskyForecast>(res, (body) => {
            let currently = body.currently;
            let response = `Current weather in ${description}:
${currently.summary}

Current temperature
${WeatherCommand.fahrenheitToCelcius(currently.temperature)} °C`;
            output.sendToChat(response);
        }));
    }
}