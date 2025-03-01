require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const {saveAppointment, cancelAppointment } = require('./db');
const { buttonText, listTimeButtons } = require('./buttons');
const CHANNEL_ID = process.env.CHANNEL_ID;

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: Object.keys(buttonText).map((key) => [
        { text: buttonText[key], callback_data: key },
      ]),
    },
  };
  bot.sendMessage(chatId, 'Выберите кнопку:', options);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userName =
    query.from.first_name || query.from.username || 'Неизвестный пользователь';

  if (query.data === 'watch') {
    const options = {
      reply_markup: {
        inline_keyboard: Object.keys(listTimeButtons).map((key) => [
          { text: listTimeButtons[key], callback_data: key },
        ]),
      },
    };
    return bot.sendMessage(chatId, 'Выберите время:', options);
  }

  if (query.data === 'cancel') {
    return await cancelAppointment(chatId, bot);
  }

  if (listTimeButtons[query.data]) {
    const selectedTime = listTimeButtons[query.data];

    const result = await saveAppointment(chatId, userName, selectedTime, bot);
    if (result) {
      await bot.sendMessage(
        CHANNEL_ID,
        `Пользователь ${userName} записался на: ${selectedTime}`
      );
      console.log(`Уведомление отправлено: ${userName} - ${selectedTime}`);
    }
  }

  bot.answerCallbackQuery(query.id, { text: 'Вы нажали кнопку!' });
});


console.log('Бот запущен...');
