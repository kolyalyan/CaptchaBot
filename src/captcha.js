import { InlineKeyboard } from 'grammy';
const BUTTONS_COUNT = 5;
export class Captcha {
    constructor(user) {
        this.availableNutritions = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'];
        if (!user.id)
            return;
        this.buttons = this.generateButtons(BUTTONS_COUNT);
        this.answer = this.buttons[Math.floor(Math.random() * BUTTONS_COUNT)];
        const notBot = 'не бот';
        const notSpamer = 'не спамер';
        const name = user.first_name + (user.last_name ? user.last_name : '');
        this.text = `❗️ВАЖНО: ${name}, если ты не бот и не спамер, пройди проверку, нажав на кнопку, где есть ${this.answer}:`;
        let botBold = {
            type: 'bold',
            offset: this.text.indexOf(notBot),
            length: notBot.length
        };
        let spamBold = {
            type: 'bold',
            offset: this.text.indexOf(notSpamer),
            length: notSpamer.length
        };
        let mention = {
            type: 'text_mention',
            offset: this.text.indexOf(name),
            length: name.length,
            user: user
        };
        this.entities = [botBold, spamBold, mention];
        this.keyboard = this.generateKeyboard(this.buttons).row();
    }
    generateButtons(buttonsCount) {
        let nutritionsArray = Array().concat([], this.availableNutritions);
        let buttonsArray = [];
        for (let i = 0; i < buttonsCount; i++) {
            const randomIndex = Math.floor(Math.random() * nutritionsArray.length);
            const nutrition = nutritionsArray[randomIndex];
            buttonsArray.push(nutrition);
            nutritionsArray.splice(randomIndex, 1);
        }
        return buttonsArray;
    }
    generateKeyboard(buttons) {
        let keyboard;
        if (buttons.length > 1) {
            const button = String(buttons.pop());
            keyboard = this.generateKeyboard(buttons).text(button, button);
        }
        else {
            keyboard = new InlineKeyboard().text(buttons[0], buttons[0]);
        }
        return keyboard;
    }
}
