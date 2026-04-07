import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';

const express = require('express');
const app = express();

// Render beradigan PORT yoki 3000-portda ishlaydi
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running...');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});



const BOT_TOKEN = '8541445321:AAF8BwcJjVA_JMCLg91q8k-JgVzp6pEa1l4'; 
const ADMIN_ID = '8499292578'; // @userinfobot orqali olingan ID-ingizni yozing
const MINI_APP_URL = 'https://cashback-1.vercel.app/';

const bot = new Telegraf(BOT_TOKEN);

// Foydalanuvchilarni yuklab olish
const loadUsers = () => {
    try {
        if (!fs.existsSync('users.json')) return [];
        return JSON.parse(fs.readFileSync('users.json'));
    } catch (e) { return []; }
};

// Foydalanuvchini saqlash
const saveUserToDB = (user) => {
    const users = loadUsers();
    if (!users.find(u => u.id === user.id)) {
        users.push(user);
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    }
};

bot.start((ctx) => {
    ctx.replyWithHTML(
        `<b>Assalomu alaykum, ${ctx.from.first_name}!</b> ✨\n\n` +
        `Klubimizga xush kelibsiz. Ilovadan foydalanish uchun ro'yxatdan o'ting.`,
        Markup.keyboard([
            [Markup.button.contactRequest('📱 Ro\'yxatdan o\'tish')]
        ]).resize().oneTime()
    );
});

// ADMINGA HAMMA FOYDALANUVCHILARNI KO'RSATISH
bot.command('allusers', (ctx) => {
    if (ctx.from.id.toString() === ADMIN_ID.toString()) {
        const users = loadUsers();
        if (users.length === 0) return ctx.reply("Hali hech kim ro'yxatdan o'tmagan.");

        let msg = `👥 <b>Foydalanuvchilar ro'yxati:</b>\n\n`;
        users.forEach((u, i) => {
            msg += `${i+1}. ${u.name} (@${u.username}) - +${u.phone}\n`;
        });
        ctx.replyWithHTML(msg);
    }
});

bot.on('contact', async (ctx) => {
    if (ctx.message && ctx.message.contact) {
        const contact = ctx.message.contact;
        const user = ctx.from;

        const userData = {
            id: user.id,
            name: user.first_name,
            username: user.username || "yo'q",
            phone: contact.phone_number,
            date: new Date().toLocaleString()
        };

        // 1. Saqlash (Eski va yangi userlar uchun)
        saveUserToDB(userData);

        // 2. Terminalga chiqarish
        console.log("Ro'yxatdan o'tdi:", userData);

        // 3. Foydalanuvchiga javob
        await ctx.reply(`Tabriklaymiz! Ro'yxatdan o'tdingiz. ✅`, Markup.removeKeyboard());
        await ctx.replyWithHTML(
            `Ilovaga kirish:`,
            Markup.inlineKeyboard([
                [Markup.button.webApp('💰 Cashback App', MINI_APP_URL)]
            ])
        );

        // 4. Adminga (@AstroPvP) xabar yuborish
        const adminMsg = `🔔 <b>Yangi Foydalanuvchi:</b>\n\n` +
                         `👤 Ismi: ${user.first_name}\n` +
                         `🔗 Username: @${user.username || 'yo\'q'}\n` +
                         `📞 Tel: +${contact.phone_number}`;
        
        try {
            await ctx.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'HTML' });
        } catch (e) { console.log("Admin xabarini yuborishda xato."); }
    }
});

bot.launch().then(() => console.log("✅ Bot ishga tushdi..."));