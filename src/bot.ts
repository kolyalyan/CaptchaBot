import 'dotenv/config';
import { Bot } from 'grammy';
import { Collection } from 'mongodb';
import { Captcha } from './captcha.js';
import initDB from './db.js';
import { NewMember, TimerFlag } from './interfaces';

const bot_token: string = process.env.BOT_TOKEN ?? 'dummy_token';
const bot = new Bot(bot_token);

let db = await initDB();
let collection: Collection<NewMember> = db.collection<NewMember>('new_users');

let timer: ReturnType<typeof setTimeout>;
let timerRunning: TimerFlag = {
    'initializator': true
};

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
            last_name: user.last_name ? user.last_name : '',
            captcha_answer: captcha.answer
        });
                    
        const timer_id = `${ctx.chat.id}_${ user.id}`;

        timer = setTimeout(async () => {
            await bot.api.deleteMessage(ctx.chat.id, message.message_id);
            timerRunning[timer_id] = false;
        }, 20000);

        timerRunning[timer_id] = true;
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

    if (timerRunning[timer_id]) return;
        
    await collection.deleteOne({chat_id: ctx.chat.id, user_id: ctx.from.id});

    const captcha = new Captcha(ctx.from);
    const message = await ctx.reply(captcha.text, {entities: captcha.entities, reply_markup: captcha.keyboard});
            
    await collection.insertOne({
        chat_id: ctx.chat.id,
        user_id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name ? ctx.from.last_name : '',
        captcha_answer: captcha.answer
    });

    timer = setTimeout(async () => {
        await bot.api.deleteMessage(ctx.chat.id, message.message_id); 
        timerRunning[timer_id] = false;
    }, 20000);

    timerRunning[timer_id] = true;
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
        clearTimeout(timer);
            
        const timer_id = `${ctx.chat?.id}_${ctx.from.id}`;
        timerRunning[timer_id] = false;

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