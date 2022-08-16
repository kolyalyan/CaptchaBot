import { InlineKeyboard } from "grammy";
import { MessageEntity, User } from "grammy/out/types.node";

const BUTTONS_COUNT: number = 5;

export class Captcha {
    private availableNutritions: string[] = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'];

    public text!: string;
    public entities!: MessageEntity[];
    public buttons!: string[];
    public answer!: string;
    public keyboard!: InlineKeyboard;

    constructor(user: User){
        if(user.id !== undefined){
            this.buttons = this.generateButtons(BUTTONS_COUNT);
            this.answer = this.buttons[Math.floor(Math.random() * BUTTONS_COUNT)];

            let notBot: string = "не бот";
            let notSpamer: string = "не спамер";
            let name: string = user.first_name;

            if(typeof user.last_name !== "undefined"){
                name += " " + user.last_name;
            }

            this.text = "❗️ВАЖНО: " + name + ", если ты не бот и не спамер, пройди проверку, нажав на кнопку, где есть " + this.answer + ":";

            let botBold: MessageEntity.CommonMessageEntity = {
                type: "bold",
                offset: this.text.indexOf(notBot),
                length: notBot.length
            };
            let spamBold: MessageEntity.CommonMessageEntity = {
                type: "bold",
                offset: this.text.indexOf(notSpamer),
                length: notSpamer.length
            };
            let mention: MessageEntity.TextMentionMessageEntity = {
                type: "text_mention",
                offset: this.text.indexOf(name),
                length: name.length,
                user: user
            };
            

            this.entities = [botBold, spamBold, mention];

            this.keyboard = this.generateKeyboard(this.buttons).row();         
        }
    }

    public generateButtons(buttonsCount: number){
        let nutritionsArray: string[] = Object.assign([], this.availableNutritions);
        let buttonsArray: string[] = [];
        
        for(let i = 0; i < buttonsCount; i++){
            let randomIndex: number = Math.floor(Math.random() * nutritionsArray.length);
            let nutrition: string = nutritionsArray[randomIndex];

            buttonsArray.push(nutrition);
            nutritionsArray.splice(randomIndex, 1);
        }

        return buttonsArray;
    }

    public generateKeyboard(buttons: string[]){
        let keyboard!: InlineKeyboard;

        if(buttons.length > 1){
            let button: string = String(buttons.pop());
            keyboard = this.generateKeyboard(buttons).text(button, button);
        }else{
            keyboard = new InlineKeyboard().text(buttons[0], buttons[0]); 
        }

        return keyboard;
    }
}
