const bot = require('./bot');
const config = require('../config');
const https = require('https');
const keyboard = require('../utils/keyboard');
const db = require('../utils/db');
const bodyparser = require('../utils/bodyparser');

const LOCATION_COMMAND = 'weatherlocation'

function fahrenheitToCelcius(fahrenheit){
    return Math.round((fahrenheit - 32) / 1.8);
}
/**
 * @param {string} query 
 * @param {function({lat,lng},string)} callback 
 */
function getWeatherVariables(query, callback){
    
    https.get(`https://maps.googleapis.com/maps/api/geocode/json?&address=${query}&key=${config.googleMapsKey}`, (res) => bodyparser.parseJson(res, body => {
        if(body.results.length == 0){
            callback(null, null);
        }else{
            let location = body.results[0].geometry.location;
            let description = body.results[0].formatted_address;
            callback(location, description);
        }
    }));
}
/**
 * @param {TelegramMessage} message
 * @param {{lat,lng}} location 
 * @param {string} description
 */
function sendForecast(message, location, description){
    https.get(`https://api.darksky.net/forecast/${config.weatherSecret}/${location.lat},${location.lng}?exclude=minutely,hourly,daily,alerts,flags`, res => bodyparser.parseJson(res, (body) => {
        let currently = body.currently;
        let response = `Current weather in ${description}:
${currently.summary}

Current temperature
${fahrenheitToCelcius(currently.temperature)} °C`;
        bot.sendMessage({chatId: message.chat.id, message: response});
    }));
}

class Weather{
    constructor(){
        /**
         * @type {Object<number, {lat,lng}>}
         */
        this.mapLocations = {};
        db.getCollection('weather', coll => {
            this.db = coll;
            coll.items.forEach(item => {
                this.mapLocations[item.user] = item;
            });
        });
        bot.registerSlashCommand('weather', 'Retrieves weather information', (...args) => this.handleWeatherCommand(...args));
        bot.registerSlashCommand(LOCATION_COMMAND, 'Registers your location for weather commands', (...args) => this.registerWeatherLocation(...args));
    }
    /**
     * 
     * @param {TelegramMessage} message 
     * @param {string} cityName
     * @param {string[]} params
     */
    handleWeatherCommand(message, slashcmd, ...params){
        if(params.length > 0){
            let query = params.join(' ');
            getWeatherVariables(query, (location, description) => sendForecast(message, location, description));
            return;
        }
        let item = this.mapLocations[message.from.id];
        if(!item){
            return bot.sendMessage({
                chatId: message.chat.id, 
                message: `You haven't registered a location yet. Use /${LOCATION_COMMAND} [Your Location] to register your location.`, 
            });
        }
        let {location, description} = item;
        sendForecast(message, location, description);
    }
    /**
     * @param {TelegramMessage} message 
     * @param {string} slashCmd 
     * @param {string[]} cityName 
     */
    registerWeatherLocation(message, slashCmd, ...cityName){
        if(!cityName || cityName.length == 0){
            bot.sendMessage({
                chatId: message.chat.id, 
                message: `Please reply to this message the place you would like to register as your city.`,
                forceReplyHandler: msg => this.registerWeatherLocation(msg, null, msg.text),
                replyId: message.message_id
            });
            return;
        }
        cityName = cityName.join(' ');
        getWeatherVariables(cityName, (location, description) => {
            if(!location){
                bot.sendMessage({chatId: message.chat.id, message: `Invalid format: Usage '/${LOCATION_COMMAND} [Your City Name]'`});
            }else{
                if(this.mapLocations[message.from.id]){
                    this.db.delete({user: message.from.id});
                }
                this.mapLocations[message.from.id] = {location, description };
                this.db.add({user: message.from.id, location, description});
                this.db.saveChanges();
                bot.sendLocation(message.chat.id, location, {replyToMessage: message.message_id});
            }
        });

    }
}
module.exports = new Weather();