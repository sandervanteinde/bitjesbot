const bot = require('./bot');
const https = require('https');
const bodyparser = require('../utils/bodyparser');
const keyboard = require('../utils/keyboard');
const Encoder = require('node-html-encoder').Encoder
const moment = require('moment');
const arrayUtil = require('../utils/arrayutil');
const encoder = new Encoder('entity');

class GameSession{
    /**
     * 
     * @param {number} chatId 
     */
    constructor(chatId){
        /**
         * @type {string}
         */
        this.token = undefined;
        this.question = undefined;
        this.chatId = chatId;
        this.running = true;
        /**
         * @type {Object<number, object>}
         */
        this.score = {};
        /**
         * @type {Object<number, moment>}
         */
        this.timeouts = {};
        this.questionId = 0;
        this.currentMessageId = -1;
    }
    formatQuestion(){
        let message = `__Question # ${this.question.id}__:\n${this.question.question}\n`;
        for(let i = 0; i < this.answers.length; i++){
            message += `\n${i + 1}) ${this.answers[i]}`;
        }
        return message;
    }
    /**
     * 
     * @param {string} string
     * @param {string} type
     * @param {string} difficulty
     * @param {string} question
     * @param {string} correct_answer
     * @param {string[]} incorrect_answers
     */
    setQuestion({category, type, difficulty, question, correct_answer, incorrect_answers}){
        question = encoder.htmlDecode(question);
        correct_answer = encoder.htmlDecode(correct_answer);
        for(let i = 0; i < incorrect_answers.length; i++)
            incorrect_answers[i] = encoder.htmlDecode(incorrect_answers[i]);
        if(!this.running) return;
        this.question = {id: ++this.questionId, category, type, difficulty, question, correct_answer, incorrect_answers};
        this.answers = arrayUtil.shuffle([correct_answer, ...incorrect_answers]);
        bot.sendMessage({
            chatId: this.chatId,
            message: this.formatQuestion(),
            keyboard: this.generateKeyboardFromQuestions(this.answers),
            parse_mode: 'markdown',
            callback: msg => {
                this.currentMessageId = msg.result.message_id;
            }
        });
    }
    stopQuestion(){
        if(this.question)
            bot.editMessage(this.chatId, this.currentMessageId, this.formatQuestion(), {parse_mode: 'markdown'});
    }
    generateKeyboardFromQuestions(answers){
        let result = [];
        let currentArr = [];
        let i = 0;
        for(; i < answers.length; i++){
            currentArr.push(keyboard.button(answers[i], 'answer_trivia', i));
            if(i % 2 == 1){
                result.push(currentArr);
                currentArr = [];
            }
        }
        if(currentArr.length == 1){
            currentArr.push('');
            result.push(currentArr);

        }
        return result;
    }
    checkRightAnswer(msg, id){
        let rightAnswer = this.answers[id] == this.question.correct_answer;
        msg.answered = true;
        let from = msg.from;
        let timeout = this.timeouts[from.id];
        let diff;
        if(this.timeouts[from.id] &&  (diff = moment().diff(timeout, 'seconds')) < 5){
            bot.answerCallbackQuery(msg.id, {notification: `You are timed out for ${5 - diff} more seconds`});
        }
        else if(this.question.answered){ //answered, but to late
            bot.answerCallbackQuery(msg.id, {notification: `To late, but your answer was: ${rightAnswer && 'correct' || 'incorrect'}`})
        }
        else if(rightAnswer){
            let entry = this.score[from.id];
            if(!entry)
            {
                entry = {name: from.first_name, score: 0};
                if(from.last_name)
                    entry.name += ` ${from.last_name}`;
                this.score[from.id] = entry;
            }
            entry.score++;
            bot.answerCallbackQuery(msg.id, {notification: 'Correct!'});
            this.stopQuestion();
            bot.sendMessage({
                chatId: this.chatId,
                message: `The correct answer was: __${this.question.correct_answer}__\n__${msg.from.first_name} ${msg.from.last_name}__ was the first to answer correctly!`,
                parse_mode: 'markdown'
            });
            if(this.questionId % 5 == 0){
                let standings = [];
                for(let id in this.score){
                    let entry = this.score[id];
                    standings.push(`${entry.name}: ${entry.score}`);
                }
                bot.sendMessage({chatId: this.chatId, message: `Current Score:\n\n${standings.join('\n')}`});
            }
            setTimeout(() => this.sendQuestion(), 5000);
            this.question = undefined;
        }else{
            bot.answerCallbackQuery(msg.id, {notification: 'Incorrect, you can\'t vote for 5 seconds'});
            this.timeouts[from.id] = moment();
        }
    }
    
    sendQuestion(){
        https.get(`https://opentdb.com/api.php?amount=1&token=${this.token}`, res => bodyparser.parseJson(res, content => {
            this.setQuestion(content.results[0]);
        }));
    }  
}
class Trivia{
    constructor(){
        bot.registerSlashCommand('trivia', 'Start a trivia session. Only usable in group chats', (...params) => this.onTriviaRequestReceived(...params), {groupOnly: true});
        bot.registerSlashCommand('stoptrivia', null, (...params) => this.onTriviaStopRequested(...params), {groupOnly: true});
        /**
         * @type {Object.<number, GameSession>}
         */
        this.sessions = {};
        for(let i = 0; i < 10; i++)
            keyboard.registerCallback('answer_trivia', (msg, command, [id])=> this.handleAnswer(msg, id));
    }
    handleAnswer(msg, answerId){
        let session = this.sessions[msg.message.chat.id];
        if(!session){
            bot.editMessage(msg.message.chat.id, msg.message.message_id, 'Something went wrong!');
            return;
        }
        session.checkRightAnswer(msg, answerId);
    }
    onTriviaRequestReceived(msg){
        if(this.sessions[msg.chat.id]){
            bot.sendMessage({chatId: msg.chat.id, message: 'A session is already going!'});
        }else{
            bot.sendMessage({chatId: msg.chat.id, message: 'Starting trivia session. The questions will start in 30 seconds. Type /stoptrivia to stop!'});
            this.startTriviaSession(msg.chat.id);
        }
    }
    startTriviaSession(chatId){
        let session = new GameSession(chatId);
        this.sessions[chatId] = session;
        https.get('https://opentdb.com/api_token.php?command=request', res =>  bodyparser.parseJson(res, content => {
            session.token = content.token;
        }));

        setTimeout(() => bot.sendMessage({chatId: chatId, message: 'Starting in 15 seconds'}), 15000);
        setTimeout(() => session.sendQuestion(chatId), 30000);
    }  
    onTriviaStopRequested(msg){
        let session = this.sessions[msg.chat.id];
        if(session){
            bot.sendMessage({chatId: msg.chat.id, message: 'Trivia session stopped!'});
            session.running = false;
            session.stopQuestion();
            delete this.sessions[msg.chat.id];
        }else{
            bot.sendMessage({chatId: msg.chat.id, message: 'There wasn\'t any session going'});
        }
    }
}
module.exports = new Trivia();