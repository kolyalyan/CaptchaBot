"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const captcha_1 = require("./captcha");
const db_1 = __importDefault(require("./db"));
const bot_token = (_a = process.env.BOT_TOKEN) !== null && _a !== void 0 ? _a : "dummy_token";
let collection;
(0, db_1.default)().then((db) => collection = db.collection("new_users"));
const bot = new grammy_1.Bot(bot_token);
bot.command("start", async (ctx) => ctx.reply("Здравствуйте!\nЯ кораблик Дюрандаль, кидаю всем капчу. Чтобы отправить в добрый путь по отлову спамеров, просто добавье меня в вашу группу."));
let timer;
let timerRunning = {
    "initializator": true
};
bot.on(":new_chat_members", async (ctx) => {
    var _a;
    let newUsers = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.new_chat_members;
    if (typeof newUsers !== "undefined") {
        newUsers.forEach((user) => {
            if (user.id !== bot.botInfo.id) {
                const captcha = new captcha_1.Captcha(user);
                ctx.reply(captcha.text, { entities: captcha.entities, reply_markup: captcha.keyboard }).then(async (message) => {
                    await collection.insertOne({
                        chat_id: ctx.chat.id,
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: (typeof user.last_name === "undefined") ? "" : user.last_name,
                        captcha_answer: captcha.answer
                    });
                    const timer_id = ctx.chat.id.toString() + '_' + user.id.toString();
                    timer = setTimeout(async () => { bot.api.deleteMessage(ctx.chat.id, message.message_id); timerRunning[timer_id] = false; }, 20000);
                    timerRunning[timer_id] = true;
                });
            }
        });
    }
});
bot.on("message", async (ctx) => {
    if ((ctx.chat.id < 0) && (typeof ctx.message.text !== "undefined")) {
        const document = await collection.findOne({ chat_id: ctx.chat.id, user_id: ctx.from.id });
        if (document != null) {
            ctx.deleteMessage();
            const timer_id = ctx.chat.id.toString() + '_' + ctx.from.id.toString();
            if ((typeof timerRunning[timer_id] === "undefined") || !timerRunning[timer_id]) {
                await collection.deleteOne({ chat_id: ctx.chat.id, user_id: ctx.from.id });
                const captcha = new captcha_1.Captcha(ctx.from);
                ctx.reply(captcha.text, { entities: captcha.entities, reply_markup: captcha.keyboard }).then(async (message) => {
                    await collection.insertOne({
                        chat_id: ctx.chat.id,
                        user_id: ctx.from.id,
                        first_name: ctx.from.first_name,
                        last_name: (typeof ctx.from.last_name === "undefined") ? "" : ctx.from.last_name,
                        captcha_answer: captcha.answer
                    });
                    timer = setTimeout(async () => { bot.api.deleteMessage(ctx.chat.id, message.message_id); timerRunning[timer_id] = false; }, 20000);
                    timerRunning[timer_id] = true;
                });
            }
        }
        ;
    }
});
bot.on("callback_query:data", async (ctx) => {
    var _a, _b, _c;
    const document = await collection.findOne({ chat_id: (_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id, user_id: ctx.from.id });
    if (document != null) {
        if (document.captcha_answer === ctx.callbackQuery.data) {
            clearTimeout(timer);
            const timer_id = ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id.toString()) + '_' + ctx.from.id.toString();
            timerRunning[timer_id] = false;
            await ctx.answerCallbackQuery({
                text: "Капча успешно пройдена, добро пожаловать в чат!"
            });
            ctx.deleteMessage();
            collection.deleteOne({ chat_id: (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id, user_id: ctx.from.id });
        }
        else {
            await ctx.answerCallbackQuery({
                text: "Ответ неверный, попробуйте ещё раз!"
            });
        }
    }
    else {
        await ctx.answerCallbackQuery({
            text: "Так, не жмякай тут чужое, фу!",
        });
    }
});
bot.start();
