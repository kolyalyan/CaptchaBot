import 'dotenv/config'
import { Bot } from "grammy";
import { Collection } from "mongodb";
import { Captcha } from "./captcha";
import initDB from "./db";
import { NewMember, TimerFlag } from "./interfaces"

const bot_token: string = process.env.BOT_TOKEN ?? "dummy_token";

let collection: Collection<NewMember>;
initDB().then((db) => collection = db.collection<NewMember>("new_users"));

const bot = new Bot(bot_token);

bot.command("start", async (ctx) => ctx.reply("Здравствуйте!\nЯ кораблик Дюрандаль, кидаю всем капчу. Чтобы отправить в добрый путь по отлову спамеров, просто добавье меня в вашу группу."));

let timer: ReturnType<typeof setTimeout>;
let timerRunning: TimerFlag = {
    "initializator": true
};

bot.on(":new_chat_members", async (ctx) => {
    let newUsers = ctx.message?.new_chat_members;

    if(typeof newUsers !== "undefined"){
        newUsers.forEach((user) => {
            if(user.id !== bot.botInfo.id){
                const captcha = new Captcha(user);
                ctx.reply(captcha.text, {entities: captcha.entities, reply_markup: captcha.keyboard}).then(async (message) => {
                    await collection.insertOne({
                        chat_id: ctx.chat.id,
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: (typeof user.last_name === "undefined") ? "" : user.last_name,
                        captcha_answer: captcha.answer
                    });
                    
                    const timer_id = ctx.chat.id.toString() + '_' + user.id.toString();

                    timer = setTimeout(async () => {bot.api.deleteMessage(ctx.chat.id, message.message_id); timerRunning[timer_id] = false;}, 20000);
                    timerRunning[timer_id] = true;
                });
            }
        });
    }
});

bot.on("message", async (ctx) => {
    if((ctx.chat.id < 0) && (typeof ctx.message.text !== "undefined")){
        const document = await collection.findOne({chat_id: ctx.chat.id, user_id: ctx.from.id});

        if(document != null){
            ctx.deleteMessage();

            const timer_id = ctx.chat.id.toString() + '_' + ctx.from.id.toString();
            if((typeof timerRunning[timer_id] === "undefined") || !timerRunning[timer_id]){
                await collection.deleteOne({chat_id: ctx.chat.id, user_id: ctx.from.id});

                const captcha = new Captcha(ctx.from);
                ctx.reply(captcha.text, {entities: captcha.entities, reply_markup: captcha.keyboard}).then(async (message) => {
                    await collection.insertOne({
                        chat_id: ctx.chat.id,
                        user_id: ctx.from.id,
                        first_name: ctx.from.first_name,
                        last_name: (typeof ctx.from.last_name === "undefined") ? "" : ctx.from.last_name,
                        captcha_answer: captcha.answer
                    });

                    timer = setTimeout(async () => {bot.api.deleteMessage(ctx.chat.id, message.message_id); timerRunning[timer_id] = false;}, 20000);
                    timerRunning[timer_id] = true;
                });
            }
        };
    }
});

bot.on("callback_query:data", async (ctx) => {
    const document = await collection.findOne({chat_id: ctx.chat?.id, user_id: ctx.from.id});

    if(document != null){
        if(document.captcha_answer === ctx.callbackQuery.data){
            clearTimeout(timer);
            const timer_id = ctx.chat?.id.toString() + '_' + ctx.from.id.toString();
            timerRunning[timer_id] = false;

            await ctx.answerCallbackQuery({
                text: "Капча успешно пройдена, добро пожаловать в чат!"
            });

            ctx.deleteMessage();
            collection.deleteOne({chat_id: ctx.chat?.id, user_id: ctx.from.id});
        }else{
            await ctx.answerCallbackQuery({
                text: "Ответ неверный, попробуйте ещё раз!"
            });
        }    
    }else{
        await ctx.answerCallbackQuery({
            text: "Так, не жмякай тут чужое, фу!",
        });
    }
});

bot.start();