import { InlineKeyboard } from 'grammy';
import { InlineKeyboardButton, MessageEntity, User } from 'grammy/out/types.node';

const BUTTONS_COUNT: number = 5;

export class Captcha {
    private availableNutritions: string[] = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'];

    public text!: string;
    public entities!: MessageEntity[];
    public answer!: string;
    public keyboard!: InlineKeyboard;

    constructor(user: User){
        if (!user.id) return;

        this.keyboard = this.generateKeyboard(BUTTONS_COUNT);

        const keyboardButtons: InlineKeyboardButton[] = this.keyboard.inline_keyboard[0];
        this.answer = keyboardButtons[Math.floor(Math.random() * BUTTONS_COUNT)].text;

        const notBot: string = 'не бот';
        const notSpamer: string = 'не спамер';
        const name: string = `${user.first_name} ${user.last_name ?? ''}`.trim();

        this.text = `❗️ВАЖНО: ${name}, если ты не бот и не спамер, пройди проверку, нажав на кнопку, где есть ${this.answer}:`;

        let botBold: MessageEntity.CommonMessageEntity = {
            type: 'bold',
            offset: this.text.indexOf(notBot),
            length: notBot.length
        };
        let spamBold: MessageEntity.CommonMessageEntity = {
            type: 'bold',
            offset: this.text.indexOf(notSpamer),
            length: notSpamer.length
        };
        let mention: MessageEntity.TextMentionMessageEntity = {
            type: 'text_mention',
            offset: this.text.indexOf(name),
            length: name.length,
            user: user
        };
            
        this.entities = [botBold, spamBold, mention];      
    }

    private generateKeyboard(buttonsCount: number){
        let nutritionsArray: string[] = Array().concat([], this.availableNutritions);
        let buttonsArray: string[] = [];
        
        for (let i = 0; i < buttonsCount; i++) {
            const randomIndex: number = Math.floor(Math.random() * nutritionsArray.length);
            const nutrition: string = nutritionsArray[randomIndex];

            buttonsArray.push(nutrition);
            nutritionsArray.splice(randomIndex, 1);
        }

        let keyboard: InlineKeyboard = buttonsArray.reduce(
            (previousValue, currentValue, index) => previousValue.text(currentValue, currentValue),
            new InlineKeyboard()
        );

        return keyboard.row();
    }
}
