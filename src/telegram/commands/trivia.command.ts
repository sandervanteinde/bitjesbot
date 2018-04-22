import { IKeyboardHandler } from "../keyboard/keyboard-handler";
import { IBotCommand } from "../bot-helpers";
import { KeyboardContext } from "../keyboard/keyboard-context";
import { CallbackQueryOutput } from "../outputs/callback-query-output";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramOutput } from "../outputs/telegram-output";
import { get } from "https";
import bodyparser from "../../utils/bodyparser";
import { ChatIdOutput } from "../outputs/chat-id-output";
import { TelegramBot } from "../telegram-bot";
import { shuffle } from "../../utils/utils";
import { TelegramInlineKeyboardButton } from "../../../typings/telegram";
import { button, formatButtons } from "../keyboard/keyboard";
import * as moment from 'moment';
import { MessageIdOutput } from "../outputs/message-id-output";
const Encoder = require('node-html-encoder').Encoder;
const encoder = new Encoder('entity');

export class TriviaCommand implements IBotCommand, IKeyboardHandler {

    private session: { [key: number]: GameSession } = {};
    constructor(private bot: TelegramBot) { }
    getCallbackNames(): string | string[] {
        return 'answertrivia';
    }
    getSlashCommands(): string | string[] {
        return ['trivia', 'stoptrivia'];
    }
    getHelpMessageText(): string | (string | null)[] | null {
        return ['Start a trivia session. Only usable in group chats', null];
    }
    isGroupOnly(): boolean {
        return true;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onQuery(query: KeyboardContext, output: CallbackQueryOutput): string | void {
        let session = this.session[query.query.message.chat.id];
        if (!session) {
            output.editMessage('Something went wrong!');
            return;
        }
        return session.checkRightAnswer(query, output);
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput): void {
        if (context.slashCommand == 'trivia')
            this.handleStart(context, output);
        else
            this.handleStop(context, output);
    }
    private handleStart(context: TelegramMessageContext, output: TelegramOutput) {
        let chatId = context.message.chat.id;
        if (this.session[chatId]) {
            output.sendToChat('A session is ongoing!', { reply: true });
            return;
        }
        output.sendToChat('Starting trivia session. The questions will start in 30 seconds. Type /stoptrivia to stop!');

        let session = new GameSession(this.bot, chatId);
        this.session[chatId] = session;
        get('https://opentdb.com/api_token.php?command=request', res => bodyparser.parseJson<{ token: string }>(res, content => {
            session.token = content.token;
        }));

        setTimeout(() => output.sendToChat('Starting in 15 seconds'), 15000);
        setTimeout(() => session.sendQuestion(), 30000);

    }
    private handleStop(context: TelegramMessageContext, output: TelegramOutput) {
        let chatId = context.message.chat.id;
        let session = this.session[chatId];
        if (session) {
            output.sendToChat('Trivia session stopped!', { reply: true });
            session.running = false;
            session.stopQuestion();
            delete this.session[chatId];
        } else {
            output.sendToChat('There wasn\'t any session going');
        }
    }
}
type OpenTdbResponse = {
    response_code: number;
    results: OpenTdbResult[];
}
type OpenTdbResult = {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}
class GameSession {
    public token: string | undefined = undefined;
    private question: undefined | (OpenTdbResult) & { id: number, answered?: boolean };
    private output: ChatIdOutput;
    public running: boolean = true;
    private questionId: number = 0;
    private answers: string[] = [];
    private currentMessageId: number = -1;
    private timeouts: { [key: number]: moment.Moment } = {}
    private score: { [key: number]: { name: string, score: number } } = {};
    constructor(private bot: TelegramBot, private chatId: number) {
        this.output = new ChatIdOutput(bot, chatId);
    }
    private setQuestion({ category, type, difficulty, question, correct_answer, incorrect_answers }: OpenTdbResult) {
        if (!this.running) return;
        question = encoder.htmlDecode(question);
        correct_answer = encoder.htmlDecode(correct_answer);
        for (let i = 0; i < incorrect_answers.length; i++)
            incorrect_answers[i] = encoder.htmlDecode(incorrect_answers[i]);
        this.question = { id: ++this.questionId, category, type, difficulty, question, correct_answer, incorrect_answers };
        this.answers = shuffle([correct_answer, ...incorrect_answers]);
        this.output.sendToChat(this.formatQuestion(), {
            keyboard: this.generateKeyboardFromQuestions(this.answers),
            parse_mode: 'Markdown',
            callback: msg => this.currentMessageId = msg.message_id
        });
    }
    private formatQuestion(): string {
        if (!this.question) throw 'Invalid state';
        let message = `__Question # ${this.question.id}__:\n${this.question.question}\n`;
        for (let i = 0; i < this.answers.length; i++) {
            message += `\n${i + 1}) ${this.answers[i]}`;
        }
        return message;
    }
    private generateKeyboardFromQuestions(answers: string[]): TelegramInlineKeyboardButton[][] {
        let buttons: TelegramInlineKeyboardButton[] = [];
        answers.forEach((a, i) => buttons.push(button(a, 'answertrivia', i.toString())));
        return formatButtons(...buttons);
    }
    sendQuestion() {
        get(`https://opentdb.com/api.php?amount=1&token=${this.token}`, res => bodyparser.parseJson<OpenTdbResponse>(res, content => {
            this.setQuestion(content.results[0]);
        }));
    }
    stopQuestion() {
        if(this.question){
            let context = new MessageIdOutput(this.bot, this.currentMessageId, this.chatId);
            context.editMessage(this.formatQuestion(), {parse_mode: 'Markdown'});
        }
    }
    checkRightAnswer(context: KeyboardContext, output: CallbackQueryOutput): string | void {
        if (!this.question) throw 'Something went wrong';
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
        } else {
            this.timeouts[from.id] = moment();
            return 'Incorrect, you can\'t vote for 5 seconds';
        }
    }
}