import 'dotenv/config';
import { Bot } from 'grammy';
import { Collection } from 'mongodb';
import { Captcha } from './captcha.js';
import initDB from './db.js';
import { NewMember } from './interfaces';

const bot_token: string = process.env.BOT_TOKEN ?? 'dummy_token';
const bot = new Bot(bot_token);

let db = await initDB();
let collection: Collection<NewMember> = db.collection<NewMember>('new_users');

let timersRunning = new Map();

bot.command('start', async (ctx) => ctx.reply(
    `Здравствуйте!
    Я кораблик Дюрандаль, кидаю всем капчу. Чтобы отправить в добрый путь по отлову спамеров, просто добавье меня в вашу группу.`
));

bot.on(':new_chat_members', async (ctx) => {
    const newUsers = ctx.message?.new_chat_members;

    if (!newUsers) return;

    await Promise.all(newUsers.map((user) => (async () => {
        if (user.is_bot) return;
                
        const captcha = new Captcha(user);
        const message = await ctx.reply(captcha.text, {entities: captcha.entities, reply_markup: captcha.keyboard});
                    
        await collection.insertOne({
            chat_id: ctx.chat.id,
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name ?? '',
            captcha_answer: captcha.answer
        });
                    
        const timer_id = `${ctx.chat.id}_${ user.id}`;

        const timer = setTimeout(async () => {
            await bot.api.deleteMessage(ctx.chat.id, message.message_id);
            timersRunning.delete(timer_id);
        }, 20000);

        timersRunning.set(timer_id, timer);
    })()));
});

bot.on('message', async (ctx) => {
    if ((ctx.chat.id >= 0) || (!ctx.message.text)) return;

    const document = await collection.findOne({
        chat_id: ctx.chat.id, 
        user_id: ctx.from.id
    });

    if (!document) return;
            
    await ctx.deleteMessage();

    const timer_id = `${ctx.chat.id}_${ctx.from.id}`;

    if (timersRunning.get(timer_id)) return;
        
    await collection.deleteOne({chat_id: ctx.chat.id, user_id: ctx.from.id});

    const captcha = new Captcha(ctx.from);
    const message = await ctx.reply(captcha.text, {entities: captcha.entities, reply_markup: captcha.keyboard});
            
    await collection.insertOne({
        chat_id: ctx.chat.id,
        user_id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name ?? '',
        captcha_answer: captcha.answer
    });

    const timer = setTimeout(async () => {
        await bot.api.deleteMessage(ctx.chat.id, message.message_id); 
        timersRunning.delete(timer_id);
    }, 20000);

    timersRunning.set(timer_id, timer);
});

bot.on('callback_query:data', async (ctx) => {
    const document = await collection.findOne({
        chat_id: ctx.chat?.id,
        user_id: ctx.from.id
    });

    if (!document){
        return ctx.answerCallbackQuery({
            text: 'Так, не жмякай тут чужое, фу!',
        });
    }

    if (document.captcha_answer === ctx.callbackQuery.data) {            
        const timer_id = `${ctx.chat?.id}_${ctx.from.id}`;

        clearTimeout(timersRunning.get(timer_id));
        timersRunning.delete(timer_id);

        await ctx.answerCallbackQuery({
            text: 'Капча успешно пройдена, добро пожаловать в чат!'
        });

        await Promise.all([
            ctx.deleteMessage(),
            collection.deleteOne({
                chat_id: ctx.chat?.id,
                user_id: ctx.from.id
            })
        ]);
    } else {
        await ctx.answerCallbackQuery({
            text: 'Ответ неверный, попробуйте ещё раз!'
        });
    }    
});

bot.start();