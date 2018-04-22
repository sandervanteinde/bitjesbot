"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const config_1 = require("../../utils/config");
const bodyparser_1 = require("../../utils/bodyparser");
const db_1 = require("../../utils/db");
class WeatherDbEntry {
    constructor(user, location, description) {
        this.user = user;
        this.location = location;
        this.description = description;
    }
}
const LOCATION_COMMAND = 'location';
class WeatherCommand {
    constructor() {
        this.mapLocations = {};
        this.database = new db_1.Database('weather');
        this.database.load(() => {
            for (let entry of this.database)
                this.mapLocations[entry.user] = entry;
        });
    }
    getSlashCommands() {
        return ['weather', LOCATION_COMMAND];
    }
    getHelpMessageText() {
        return ['Retrieves weather information', 'Registers your location for weather commands'];
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        if (context.slashCommand == LOCATION_COMMAND)
            this.handleLocationCommand(context, output);
        else
            this.handleWeatherCommand(context, output);
    }
    handleWeatherCommand(context, output) {
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
    handleLocationCommand(context, output) {
        let citNameArr = context.args;
        if (!citNameArr || citNameArr.length == 0) {
            output.sendToChat('Please reply to this message the place you would like to register as your city.', {
                reply: true,
                forceReply: (msg) => this.processCityNameRequest(msg.message.text, msg.message.from.id, output)
            });
            return;
        }
        let cityName = citNameArr.join(' ');
        this.processCityNameRequest(cityName, context.message.from.id, output);
    }
    processCityNameRequest(cityName, userId, output) {
        WeatherCommand.getWeatherVariables(cityName, (location, description) => {
            if (!location || !description) {
                output.sendToChat(`Invalid format: Usage '/${LOCATION_COMMAND} [Your City Name]'`, { reply: true });
            }
            else {
                if (this.mapLocations[userId]) {
                    this.mapLocations[userId].location = location;
                }
                else {
                    let newEntry = new WeatherDbEntry(userId, location, description);
                    this.database.add(newEntry);
                    this.mapLocations[userId] = newEntry;
                }
                this.database.saveChanges();
                output.sendLocation(location, { reply: true });
            }
        });
    }
    static fahrenheitToCelcius(fahrenheit) {
        return Math.round((fahrenheit - 32) / 1.8);
    }
    static getWeatherVariables(query, callback) {
        https_1.get(`https://maps.googleapis.com/maps/api/geocode/json?&address=${query}&key=${config_1.default.googleMapsKey}`, (res) => bodyparser_1.default.parseJson(res, body => {
            if (body.results.length == 0) {
                callback();
            }
            else {
                let location = body.results[0].geometry.location;
                let description = body.results[0].formatted_address;
                callback(location, description);
            }
        }));
    }
    static sendForecast(output, location, description) {
        https_1.get(`https://api.darksky.net/forecast/${config_1.default.weatherSecret}/${location.lat},${location.lng}?exclude=minutely,hourly,daily,alerts,flags`, res => bodyparser_1.default.parseJson(res, (body) => {
            let currently = body.currently;
            let response = `Current weather in ${description}:
${currently.summary}

Current temperature
${WeatherCommand.fahrenheitToCelcius(currently.temperature)} °C`;
            output.sendToChat(response);
        }));
    }
}
exports.WeatherCommand = WeatherCommand;
//# sourceMappingURL=weather.command.js.map