var _a;
import 'dotenv/config';
import { Bot } from 'grammy';
import { Captcha } from './captcha.js';
import initDB from './db.js';
const bot_token = (_a = process.env.BOT_TOKEN) !== null && _a !== void 0 ? _a : 'dummy_token';
const bot = new Bot(bot_token);
//let db = await initDB();
//let collection: Collection<NewMember> = db.collection<NewMember>('new_users');
let collection;
initDB().then((db) => {
    collection = db.collection('new_users');
});
let timer;
let timerRunning = {
    "initializator": true
};
bot.command("start", async (ctx) => ctx.reply(`Здравствуйте!
    Я кораблик Дюрандаль, кидаю всем капчу. Чтобы отправить в добрый путь по отлову спамеров, просто добавье меня в вашу группу.`));
bot.on(':new_chat_members', async (ctx) => {
    var _a;
    const newUsers = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.new_chat_members;
    if (!newUsers)
        return;
    newUsers.forEach(async (user) => {
        //if (user.is_bot) return;
        const captcha = new Captcha(user);
        const message = await ctx.reply(captcha.text, { entities: captcha.entities, reply_markup: captcha.keyboard });
        await collection.insertOne({
            chat_id: ctx.chat.id,
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name ? user.last_name : '',
            captcha_answer: captcha.answer
        });
        const timer_id = `${ctx.chat.id}_${user.id}`;
        timer = setTimeout(async () => {
            bot.api.deleteMessage(ctx.chat.id, message.message_id);
            timerRunning[timer_id] = false;
        }, 20000);
        timerRunning[timer_id] = true;
    });
});
bot.on("message", async (ctx) => {
    if ((ctx.chat.id >= 0) || (!ctx.message.text))
        return;
    const document = await collection.findOne({
        chat_id: ctx.chat.id,
        user_id: ctx.from.id
    });
    if (!document)
        return;
    ctx.deleteMessage();
    const timer_id = `${ctx.chat.id}_${ctx.from.id}`;
    if (timerRunning[timer_id])
        return;
    await collection.deleteOne({ chat_id: ctx.chat.id, user_id: ctx.from.id });
    const captcha = new Captcha(ctx.from);
    const message = await ctx.reply(captcha.text, { entities: captcha.entities, reply_markup: captcha.keyboard });
    await collection.insertOne({
        chat_id: ctx.chat.id,
        user_id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name ? ctx.from.last_name : '',
        captcha_answer: captcha.answer
    });
    timer = setTimeout(async () => {
        bot.api.deleteMessage(ctx.chat.id, message.message_id);
        timerRunning[timer_id] = false;
    }, 20000);
    timerRunning[timer_id] = true;
});
bot.on('callback_query:data', async (ctx) => {
    var _a, _b, _c;
    const document = await collection.findOne({
        chat_id: (_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id,
        user_id: ctx.from.id
    });
    if (!document) {
        await ctx.answerCallbackQuery({
            text: 'Так, не жмякай тут чужое, фу!',
        });
        return;
    }
    if (document.captcha_answer === ctx.callbackQuery.data) {
        clearTimeout(timer);
        const timer_id = `${(_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id}_${ctx.from.id}`;
        timerRunning[timer_id] = false;
        await ctx.answerCallbackQuery({
            text: 'Капча успешно пройдена, добро пожаловать в чат!'
        });
        ctx.deleteMessage();
        collection.deleteOne({
            chat_id: (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id,
            user_id: ctx.from.id
        });
    }
    else {
        await ctx.answerCallbackQuery({
            text: 'Ответ неверный, попробуйте ещё раз!'
        });
    }
});
bot.start();
