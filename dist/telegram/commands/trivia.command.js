"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const bodyparser_1 = require("../../utils/bodyparser");
const chat_id_output_1 = require("../outputs/chat-id-output");
const utils_1 = require("../../utils/utils");
const keyboard_1 = require("../keyboard/keyboard");
const moment = require("moment");
const message_id_output_1 = require("../outputs/message-id-output");
const Encoder = require('node-html-encoder').Encoder;
const encoder = new Encoder('entity');
class TriviaCommand {
    constructor(bot) {
        this.bot = bot;
        this.session = {};
    }
    getCallbackNames() {
        return 'answertrivia';
    }
    getSlashCommands() {
        return ['trivia', 'stoptrivia'];
    }
    getHelpMessageText() {
        return ['Start a trivia session. Only usable in group chats', null];
    }
    isGroupOnly() {
        return true;
    }
    isPrivateOnly() {
        return false;
    }
    onQuery(query, output) {
        let session = this.session[query.query.message.chat.id];
        if (!session) {
            output.editMessage('Something went wrong!');
            return;
        }
        return session.checkRightAnswer(query, output);
    }
    onMessage(context, output) {
        if (context.slashCommand == 'trivia')
            this.handleStart(context, output);
        else
            this.handleStop(context, output);
    }
    handleStart(context, output) {
        let chatId = context.message.chat.id;
        if (this.session[chatId]) {
            output.sendToChat('A session is ongoing!', { reply: true });
            return;
        }
        output.sendToChat('Starting trivia session. The questions will start in 30 seconds. Type /stoptrivia to stop!');
        let session = new GameSession(this.bot, chatId);
        this.session[chatId] = session;
        https_1.get('https://opentdb.com/api_token.php?command=request', res => bodyparser_1.default.parseJson(res, content => {
            session.token = content.token;
        }));
        setTimeout(() => output.sendToChat('Starting in 15 seconds'), 1000);
        setTimeout(() => session.sendQuestion(), 3000);
    }
    handleStop(context, output) {
        let chatId = context.message.chat.id;
        let session = this.session[chatId];
        if (session) {
            output.sendToChat('Trivia session stopped!', { reply: true });
            session.running = false;
            session.stopQuestion();
            delete this.session[chatId];
        }
        else {
            output.sendToChat('There wasn\'t any session going');
        }
    }
}
exports.TriviaCommand = TriviaCommand;
class GameSession {
    constructor(bot, chatId) {
        this.bot = bot;
        this.chatId = chatId;
        this.token = undefined;
        this.running = true;
        this.questionId = 0;
        this.answers = [];
        this.currentMessageId = -1;
        this.timeouts = {};
        this.score = {};
        this.output = new chat_id_output_1.ChatIdOutput(bot, chatId);
    }
    setQuestion({ category, type, difficulty, question, correct_answer, incorrect_answers }) {
        if (!this.running)
            return;
        question = encoder.htmlDecode(question);
        correct_answer = encoder.htmlDecode(correct_answer);
        for (let i = 0; i < incorrect_answers.length; i++)
            incorrect_answers[i] = encoder.htmlDecode(incorrect_answers[i]);
        this.question = { id: ++this.questionId, category, type, difficulty, question, correct_answer, incorrect_answers };
        this.answers = utils_1.shuffle([correct_answer, ...incorrect_answers]);
        this.output.sendToChat(this.formatQuestion(), {
            keyboard: this.generateKeyboardFromQuestions(this.answers),
            parse_mode: 'Markdown',
            callback: msg => this.currentMessageId = msg.message_id
        });
    }
    formatQuestion() {
        if (!this.question)
            throw 'Invalid state';
        let message = `__Question # ${this.question.id}__:\n${this.question.question}\n`;
        for (let i = 0; i < this.answers.length; i++) {
            message += `\n${i + 1}) ${this.answers[i]}`;
        }
        return message;
    }
    generateKeyboardFromQuestions(answers) {
        let buttons = [];
        answers.forEach((a, i) => buttons.push(keyboard_1.button(a, 'answertrivia', i.toString())));
        return keyboard_1.formatButtons(...buttons);
    }
    sendQuestion() {
        https_1.get(`https://opentdb.com/api.php?amount=1&token=${this.token}`, res => bodyparser_1.default.parseJson(res, content => {
            this.setQuestion(content.results[0]);
        }));
    }
    stopQuestion() {
        if (this.question) {
            let context = new message_id_output_1.MessageIdOutput(this.bot, this.currentMessageId, this.chatId);
            context.editMessage(this.formatQuestion(), { parse_mode: 'Markdown' });
        }
    }
    checkRightAnswer(context, output) {
        if (!this.question)
            throw 'Something went wrong';
        let id = Number(context.args[0]);
        let rightAnswer = this.answers[id] == this.question.correct_answer;
        let from = context.query.from;
        let timeout = this.timeouts[from.id];
        let diff;
        if (timeout && (diff = moment().diff(timeout, 'seconds')) < 5) {
            return `You are timed out for ${5 - diff} more seconds`;
        }
        else if (this.question.answered) { //answered, but to late
            return `To late, but your answer was: ${rightAnswer && 'correct' || 'incorrect'}`;
        }
        else if (rightAnswer) {
            let entry = this.score[from.id];
            if (!entry) {
                entry = { name: from.first_name, score: 0 };
                if (from.last_name)
                    entry.name += ` ${from.last_name}`;
                this.score[from.id] = entry;
            }
            entry.score++;
            this.stopQuestion();
            this.output.sendToChat(`The correct answer was: __${this.question.correct_answer}__\n__${entry.name} ${context.query.from.last_name}__ was the first to answer correctly!`, {
                parse_mode: 'Markdown'
            });
            if (this.questionId % 5 == 0) {
                let standings = [];
                for (let id in this.score) {
                    let entry = this.score[id];
                    standings.push(`${entry.name}: ${entry.score}`);
                }
                this.output.sendToChat(`Current Score:\n\n${standings.join('\n')}`);
            }
            setTimeout(() => this.sendQuestion(), 5000);
            this.question = undefined;
            return 'Correct!';
        }
        else {
            this.timeouts[from.id] = moment();
            return 'Incorrect, you can\'t vote for 5 seconds';
        }
    }
}
//# sourceMappingURL=trivia.command.js.map