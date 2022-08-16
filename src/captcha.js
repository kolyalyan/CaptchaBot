"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Captcha = void 0;
const grammy_1 = require("grammy");
const BUTTONS_COUNT = 5;
class Captcha {
    constructor(user) {
        this.availableNutritions = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'];
        if (user.id !== undefined) {
            this.buttons = this.generateButtons(BUTTONS_COUNT);
            this.answer = this.buttons[Math.floor(Math.random() * BUTTONS_COUNT)];
            let notBot = "не бот";
            let notSpamer = "не спамер";
            let name = user.first_name;
            if (typeof user.last_name !== "undefined") {
                name += " " + user.last_name;
            }
            this.text = "❗️ВАЖНО: " + name + ", если ты не бот и не спамер, пройди проверку, нажав на кнопку, где есть " + this.answer + ":";
            let botBold = {
                type: "bold",
                offset: this.text.indexOf(notBot),
                length: notBot.length
            };
            let spamBold = {
                type: "bold",
                offset: this.text.indexOf(notSpamer),
                length: notSpamer.length
            };
            let mention = {
                type: "text_mention",
                offset: this.text.indexOf(name),
                length: name.length,
                user: user
            };
            this.entities = [botBold, spamBold, mention];
            this.keyboard = this.generateKeyboard(this.buttons).row();
        }
    }
    generateButtons(buttonsCount) {
        let nutritionsArray = Object.assign([], this.availableNutritions);
        let buttonsArray = [];
        for (let i = 0; i < buttonsCount; i++) {
            let randomIndex = Math.floor(Math.random() * nutritionsArray.length);
            let nutrition = nutritionsArray[randomIndex];
            buttonsArray.push(nutrition);
            nutritionsArray.splice(randomIndex, 1);
        }
        return buttonsArray;
    }
    generateKeyboard(buttons) {
        let keyboard;
        if (buttons.length > 1) {
            let button = String(buttons.pop());
            keyboard = this.generateKeyboard(buttons).text(button, button);
        }
        else {
            keyboard = new grammy_1.InlineKeyboard().text(buttons[0], buttons[0]);
        }
        return keyboard;
    }
}
exports.Captcha = Captcha;
